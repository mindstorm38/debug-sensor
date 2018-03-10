
const SerialPort = require('serialport');
const utils = require('../utils');
const { ipcMain } = require('electron');
const packetManager = require('./packet-manager');
const rendererConnector = require('./renderer-connector');

const UPDATE_SERIAL_PORTS_INTERVAL = 5000;
const BAUDRATES = [ 110, 300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 28800, 38400, 56000, 57600, 115200 ];
const INITIAL_BAUDRATE = 115200;

let rendererMain = null;
let rendererGraph = null;
let rendererConsole = null;

let currentSerialPorts = [];
let updateIntervalId = null;
let connectedPort = null;
let state = 'no_port';
let buffer = null;

module.exports.init = () => {

};

rendererConnector.registerRendererInit( 'main', ( ipc ) => {

	rendererMain = ipc;

	sendState();
	initAvailablesBaudrates();
	updateCurrentSerialPorts( true );

	if ( updateIntervalId !== null ) clearInterval( updateIntervalId );

	updateIntervalId = setInterval( () => {

		updateCurrentSerialPorts( false );

	}, UPDATE_SERIAL_PORTS_INTERVAL );

} );

rendererConnector.registerRendererInit( 'graph', ( ipc ) => {

	rendererGraph = ipc;

} );

rendererConnector.registerRendererInit( 'console', ( ipc ) => {

	rendererConsole = ipc;

} );

function initAvailablesBaudrates( ipc ) {

	if ( rendererMain === null ) return;

	rendererMain.send( 'serial-baudrates-list', BAUDRATES, INITIAL_BAUDRATE );

}

function updateCurrentSerialPorts( init = false ) {

	SerialPort.list( ( err, newSerialPorts ) => {

		if ( canUpdatePorts() && !init && rendererMain !== null ) {

			utils.arrayDif( currentSerialPorts, newSerialPorts, ( p1, p2 ) => {
				return p1.comName === p2.comName;
			}, ( addedPort ) => {

				rendererMain.send( 'serial-port-add', addedPort.comName );

			}, ( removedPort ) => {

				rendererMain.send( 'serial-port-remove', removedPort.comName );

			} );

		}

		currentSerialPorts = newSerialPorts;

		if ( canUpdatePorts() && init && rendererMain !== null ) {

			let ports = [];

			for ( let i in currentSerialPorts ) {

				ports.push( currentSerialPorts[ i ].comName );

			}

			rendererMain.send( 'serial-ports-init', ports );

		}

		if ( canUpdatePorts() ) {

			if ( currentSerialPorts.length > 0 ) {
				setState( 'waiting' );
			} else {
				setState( 'no_port' );
			}

		}

	} );

}

function canUpdatePorts() {
	return state === 'no_port' || state === 'waiting';
}

function setState( newState ) {
	state = newState;
	sendState();
}

function sendState( ipc ) {
	if ( rendererMain !== null ) rendererMain.send( 'serial-state', state );
	if ( rendererConsole !== null ) rendererConsole.send( 'console-can-send', ( state === 'connected' ) );
}

function connect( port, baudrate ) {

	if ( state === 'connected' ) return;

	if ( BAUDRATES.indexOf( baudrate ) === -1 ) {

		initAvailablesBaudrates();
		baudrate = INITIAL_BAUDRATE;

	}

	connectedPort = new SerialPort( port, {
		baudRate: baudrate
	}, ( err ) => {

		if ( err ) {

			console.log( `Error while establishing serial connection to ${port}`, err );

			connectedPort = null;
			return;

		}

		buffer = null;

		setState( 'connected' );

	} );

	connectedPort.on( 'error', ( err ) => {

		console.log( "Serial connection error : ", err );

	} );

	connectedPort.on( 'close', ( err ) => {

		console.log( "Serial connection closed : ", err );
		disconnect();

	} );

}

function disconnect() {

	if ( state !== 'connected' ) return;

	if ( connectedPort !== null && connectedPort.isOpen ) connectedPort.close();

	state = 'no_port';
	updateCurrentSerialPorts( false );

}

ipcMain.on( 'serial-connect', ( event, port, baudrate ) => {
	connect( port, baudrate );
} );

ipcMain.on( 'serial-disconnect', ( event ) => {
	disconnect();
} );

ipcMain.on( 'console-send', ( event, bytes ) => {
	consoleSend( bytes );
} );

function consolePush( bytes ) {
	if ( bytes.length === 0 ) return;
	if ( rendererConsole !== null ) rendererConsole.send( 'console-push', bytes );
}

function consoleSend( bytes ) {
	if ( state !== 'connected' || connectedPort === null ) return;
	connectedPort.write( Buffer.from( bytes ) );
}

function valuesAdded( values ) {
	if ( rendererGraph !== null ) rendererGraph.send( 'graph-value-add', values, new Date() );
	if ( rendererMain !== null ) {
		for ( let i in values ) {
			rendererMain.send( 'packet-segment-value', i, values[ i ] );
		}
	}
}

function updateBuffer() {

	if ( state !== 'connected' || connectedPort === null ) return;

	let packet = packetManager.getCurrentPacket();
	if ( packet === null ) return;

	let newData = connectedPort.read();

	if ( newData !== null ) {

		if ( buffer === null ) buffer = Buffer.from( newData );
		else buffer = Buffer.concat( [ buffer, newData ] );

	} else return; // Stop this funcion if no new data

	let unreadBytes = [];
	let minSize = packet.getSize();
	let maxSize = minSize * 2; // Max size if all bytes are escaped

	let packetDetected = false;
	let escape = false;

	let target = Buffer.alloc( minSize );
	let targetIndex = 0;

	let sliceIndex = 0;

	for ( let i = 0; i < buffer.length; i++ ) {

		let b = buffer[ i ];

		if ( !escape && b === packet.escape ) {

			escape = true;
			continue;

		}

		if ( packetDetected ) {

			if ( !escape && b === packet.eof ) {

				packetDetected = false;

				sliceIndex = i + 1;

				if ( targetIndex === minSize ) {

					let values = packet.parseBuffer( target );

					valuesAdded( values );

				} else if ( packet.sof === packet.eof ) { // If SOF and EOF are same, then slice buffer to the EOF (and not to the byte after the EOF) to be sure that isn't a SOF

					sliceIndex--;
					i--; // Re-loop exact same byte
					continue;

				}

			} else {

				target[ targetIndex ] = b;
				targetIndex++;

			}

		} else {

			if ( !escape && b === packet.sof ) {

				packetDetected = true;
				targetIndex = 0;
				sliceIndex = i; // I think this line is useless

			} else {

				unreadBytes.push( b );
				sliceIndex = i + 1;

			}

		}

		if ( escape ) escape = false;

	}

	if ( sliceIndex !== 0 ) buffer = buffer.slice( sliceIndex );

	consolePush( unreadBytes );

}

setInterval( updateBuffer, 100 );
