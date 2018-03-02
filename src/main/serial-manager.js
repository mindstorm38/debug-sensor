
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
	if ( rendererMain === null ) return;
	rendererMain.send( 'serial-state', state );
}

function connect( port, baudrate ) {

	if ( state === 'connected' ) return;

	if ( BAUDRATES.indexOf( baudrate ) === -1 ) initAvailablesBaudrates();

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

	connectedPort.on( 'data', ( data ) => {

		if ( buffer === null ) buffer = Buffer.from( data );
		else buffer = Buffer.concat( [ buffer, data ] );

		parseBuffer();

	} );

}

function disconnect() {

	if ( state !== 'connected' ) return;

	if ( connectedPort !== null && connectedPort.isOpen ) connectedPort.close();

	state = 'no_port';
	updateCurrentSerialPorts( true );

}

ipcMain.on( 'serial-connect', ( event, port, baudrate ) => {
	connect( port, baudrate );
} );

ipcMain.on( 'serial-disconnect', ( event ) => {
	disconnect();
} );

function valuesAdded( values ) {
	if ( rendererGraph !== null ) rendererGraph.send( 'graph-value-add', values, new Date() );
	if ( rendererMain !== null ) {
		for ( let i in values ) {
			rendererMain.send( 'packet-segment-value', i, values[ i ] );
		}
	}
}

function parseBuffer() {

	if ( buffer === null ) return;

	let packet = packetManager.getCurrentPacket();

	if ( packet === null ) return;

	let minSize = packet.getSize();

	while ( buffer.length >= ( minSize + 2 ) ) { // +2 for SOF or EOF

		// let maxSize = minSize * 2;

		for ( let i = 0; i < buffer.length; i++ ) {

			let b = buffer[ i ];

			if ( b === packet.sof ) {

				buffer = buffer.slice( i + 1 );
				break;

			}

		}

		if ( buffer.length < ( minSize + 1 ) ) return; // +1 for EOF, SOF has been sliced

		let target = Buffer.alloc( minSize ); // Packet data buffer
		let targetIndex = 0;
		let escape = false;

		for ( let i = 0; i < buffer.length; i++ ) {

			let b = buffer[ i ];

			if ( !escape && b === packet.escape ) {
				escape = true;
				continue;
			}

			if ( !escape && b === packet.eof ) {

				buffer = buffer.slice( i + 1 );
				break;

			}

			target[ targetIndex ] = b;

			targetIndex++;

			if ( escape ) {
				escape = false;
			}

		}

		if ( targetIndex !== minSize ) return; // Stop read if target not fully filled

		let values = packet.parseBuffer( target );

		valuesAdded( values );

	}

}
