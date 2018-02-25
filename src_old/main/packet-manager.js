// Packets saving and loading
const packetManager = module.exports;

const paths = require('./paths');
const path = require('path');
const jsonfile = require('jsonfile');
const fs = require('fs');
const packet = require('../common/packet');
const Packet = packet.Packet;
const Type = packet.Type;

const packetsFile = path.join( paths.appdata, 'packets.json' );

const packets = [];

function savePackets() {

	let json = {
		packets: []
	};

	packets.forEach( packet => {

		let packetObj = {
			identifier: packet.identifier,
			segments: [],
			sof: packet.sof,
			eof: packet.eof,
			escape: packet.escape
		};

		packet.segments.forEach( segment => {

			let segmentObj = {
				identifier: segment.identifier,
				type: segment.type.identifier
			};

			packetObj.segments.push( segmentObj );

		} );

		json.packets.push( packetObj );

	} );

	jsonfile.writeFile( packetsFile, json, ( err ) => {} );

}

function loadPackets() {

	packets = [];

	if ( !fs.existsSync( packetsFile ) ) {

		savePackets();

	} else {

		let json = jsonfile.readFileSync( packetsFile );

		json.packets.forEach( packetObj => {

			let packet = new Packet( packetObj.identifier );
			packet.sof = packetObj.sof;
			packet.eof = packetObj.eof;
			packet.escape = packetObj.escape;

			packetObj.segments.forEach( segmentObj => {

				packet.newSegment( segmentObj.identifier, Type.fromIdentifier( segmentObj.type ) );

			} );

			packets.push( packet );

		} );

	}

	packetManager.packets = packets;

}

packetManager.savePackets = savePackets;
packetManager.loadPackets = loadPackets;
packetManager.packets = packets;
