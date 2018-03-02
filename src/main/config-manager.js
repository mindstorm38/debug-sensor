
const path = require('path');
const fs = require('fs');
const jsonfile = require('jsonfile');
const packetManager = require('./packet-manager');
const { Packet, Type } = packetManager;
const bitManager = require('./bit-manager');

const configFile = path.join( global.debugsensor.appdata, 'config.json' );

function save() {

	let packet = packetManager.getCurrentPacket();

	let json = {
		packet: {
			identifier: packet.identifier,
			segments: [],
			sof: packet.sof,
			eof: packet.eof,
			escape: packet.escape
		}
	};

	packet.segments.forEach( ( segment ) => {

		json.packet.segments.push( {
			identifier: segment.identifier,
			type: segment.type.identifier
		} );

	} );

	jsonfile.writeFile( configFile, json, ( err ) => {
		if ( err ) console.error( "Error while saving configuration", err );
	} );

}

function load() {

	if ( !fs.existsSync( configFile ) ) {

		save();

	} else {

		let json = jsonfile.readFileSync( configFile );
		let packetJson = json.packet;

		let packet = new Packet( packetJson.identifier );
		packet.sof = packetJson.sof;
		packet.eof = packetJson.eof;
		packet.escape = packetJson.escape;

		packetJson.segments.forEach( ( segmentJson ) => {

			packet.newSegment( segmentJson.identifier, Type.fromIdentifier( segmentJson.type ) );

		} );

		packetManager.setCurrentPacket( packet );

	}

}

module.exports = {
	save: save,
	load: load
};
