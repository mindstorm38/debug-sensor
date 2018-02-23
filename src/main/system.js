// Global logic system
const system = module.exports;

// Requires
const path = require('path');
const fs = require('fs');
const jsonfile = require('jsonfile');
const main = require('./main');
const packetManager = require('./packet-manager');
const serialManager = require('./serial-manager');
const packet = require('../common/packet');
const Packet = packet.Packet;
const PacketSegment = packet.PacketSegment;
const Type = packet.Type;
const electron = require('electron');
const ipc = electron.ipcMain;

// Initialize
function init() {

	manager.loadPackets();

	currentPacket = manager.packets[ 0 ];

}
system.init = init;

// Renderers process
const renderers = {
	main: {
		ipc: null,
		init: ( ipc ) => {

			initCurrentPacket();
			initCurrentSerialPorts();

		}
	}
};

ipc.on( 'register-renderer-process', ( event, id ) => {
	let renderer = renderers[ id ];
	if ( renderer !== undefined ) {
		renderer.init( renderer.ipc = event.sender );
	}
} );

// Packets
let currentPacket = null;

function setCurrentPacket( packet ) {
	currentPacket = packet
	initCurrentPacket();
}
system.setCurrentPacket = setCurrentPacket;

function initCurrentPacket() {

	if ( renderers.main.ipc === null ) return;

	let ipc = renderers.main.ipc;

	let segments = [];

	for ( let i in currentPacket.segments ) {

		let segment = currentPacket.segments[ i ];

		segments.push( {
			uid: segment.uid,
			name: segment.getName(),
			size: segment.getSize()
		} );

	}

	ipc.send( 'packet-segment-init', segments );

}

ipc.on( 'packet-segment-details', ( event, uid ) => {
	let segment = currentPacket.getSegment( uid );
	if ( segment !== null ) {
		event.sender.send( 'packet-segment-details', uid, {
			identifier: segment.identifier,
			type: segment.type.identifier,
			defaultName: segment.getDefaultName()
		} );
	}
} )

ipc.on( 'packet-segment-identifier', ( event, uid, identifier ) => {
	let segment = currentPacket.getSegment( uid );
	if ( segment !== null ) {
		segment.identifier = identifier;
		event.sender.send( 'packet-segment-name', uid, segment.getName() );
		manager.savePackets();
	}
} );

ipc.on( 'packet-segment-type', ( event, uid, type ) => {
	let segment = currentPacket.getSegment( uid );
	if ( segment !== null ) {
		segment.type = Type.fromIdentifier( type );
		event.sender.send( 'packet-segment-size', uid, segment.getSize() );
		manager.savePackets();
	}
} );

ipc.on( 'packet-segment-remove', ( event, uid ) => {
	let segment = currentPacket.getSegment( uid );
	if ( segment !== null ) {
		currentPacket.removeSegment( segment );
		event.sender.send( 'packet-segment-remove', uid );
		manager.savePackets();
	}
} );

ipc.on( 'packet-segment-add', ( event ) => {
	let segment = currentPacket.newSegment( '', Type.U_INT_8 );
	event.sender.send( 'packet-segment-add', segment.uid, segment.getName(), segment.getSize() );
	manager.savePackets();
} );

// Serial
let serialPorts = [];
let connectedPort = null;

function initCurrentSerialPorts() {

	if ( renderers.main.ipc === null ) return;

	let ipc = renderers.main.ipc;

	manager.updateSerialPorts( undefined, undefined, ( serialPorts ) => {

		let ports = [];

		for ( let i in serialPorts ) {

			ports.push( serialPorts[ i ].comName );

		}

		ipc.send( 'serial-port-init', ports );

	} );

}

function updateCurrentSerialPorts() {

	if ( renderers.main.ipc === null ) return;

	let ipc = renderers.main.ipc;

	manager.updateSerialPorts( addedPort => {
		ipc.send( 'serial-port-add', addedPort.comName );
	}, removedPort => {
		ipc.send( 'serial-port-remove', removedPort.comName );
	} );

}

setInterval( updateCurrentSerialPorts, 5000 );

function updateSerialPorts( addedPortFunction, removedPortFunction, callback ) {

	serialport.list( ( err, ports ) => {

		if ( err ) {

			console.error( "Failed to list serial ports", err );
			return;

		}

		if ( addedPortFunction !== undefined && removedPortFunction !== undefined ) {

			utils.arrayDif( serialPorts, ports, ( port1, port2 ) => {
				return port1.comName === port2.comName;
			}, addedPort => {
				addedPortFunction( addedPort )
			}, removedPort => {
				removedPortFunction( removedPort)
			} );

		}

		serialPorts = ports;
		manager.serialPorts = serialPorts;

		if ( callback ) callback( serialPorts );

	} );

}
