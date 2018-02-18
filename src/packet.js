/**
 * Renderer paquet manager
 */

const Type = require('./type').Type;
const utils = require('./utils');
const $ = require('jquery');

class Packet {

	constructor() {

		this.parts = [];

	}

}

class PacketPart {

	constructor( identifier, type ) {

		if ( !( type instanceof Type ) ) throw new TypeError("Invalid 'type' parameter, must be extends from 'Type' class");

		this.element = document.createElement('div');
		this.element.classList.add('ds-part');
		this.element.addEventListener( 'click', () => {

			editPacketPart( this );

		} );

		this.identifierElement = document.createElement('div');
		this.identifierElement.classList.add('ds-identifier');
		this.element.appendChild( this.identifierElement );

		this.ruleElement = document.createElement('div');
		this.ruleElement.classList.add('ds-rule');
		this.element.appendChild( this.ruleElement );

		this.ruleSizeElement = document.createElement('div');
		this.ruleSizeElement.classList.add('ds-size');
		this.ruleElement.appendChild( this.ruleSizeElement );

		this.ruleTypeElement = document.createElement('div');
		this.ruleTypeElement.classList.add('ds-type');
		this.ruleElement.appendChild( this.ruleTypeElement );

		this.identifier = identifier;
		this.type = type;

	}

	set identifier( identifier ) {

		this._identifier = identifier || this._type.name;
		this.identifierElement.textContent = this.identifier;

	}

	get identifier() {
		return this._identifier;
	}

	set type( type ) {

		this._type = type;
		this.element.style.flex = `${this._type.size} 1 0`;
		this.ruleSizeElement.textContent = this._type.size + ' byte' + ( this._type.size > 1 ? 's' : '' );
		this.ruleTypeElement.textContent = this._type.name;

	}

	get type() {
		return this._type;
	}

}

const diagramElt = document.querySelector('div.ds-diagram');
const partEdit = document.querySelector('div.ds-part-edit');
const partEditIdentifierElt = document.querySelector('input#ds-packet-part-edit-identifier');
const partEditTypeElt = document.querySelector('select#ds-packet-part-edit-type');
const partEditCloseElt = document.querySelector('button#ds-packet-part-edit-close');
const partEditLinesElt = partEdit.querySelector('svg.ds-lines');

partEditIdentifierElt.addEventListener( 'keyup', () => {
	applyEditPacketPartIdentifier();
} );

partEditTypeElt.addEventListener( 'change', () => {
	applyEditPacketPartType();
} );

partEditCloseElt.addEventListener( 'click', () => {
	editPacketPart( null );
} );

window.addEventListener( 'resize', () => {
	updatePacketPartLines();
} );

let currentEditPacketPart = null;

// Draw packet in driagram
function drawPacketInDiagram( packet ) {

	if ( !( packet instanceof Packet ) ) throw new TypeError("Invalid 'packet' argument, must be a Packet");

	diagramElt.innerHTML = "";

	packet.parts.forEach( part => {

		diagramElt.appendChild( part.element );

	} );

}

// Edit packet part
function editPacketPart( packetPart ) {

	if ( packetPart != null && !( packetPart instanceof PacketPart ) ) throw new TypeError("Invalid 'packetPart' argument, must be a PacketPart");

	if ( currentEditPacketPart != null ) {

		currentEditPacketPart.element.classList.remove('ds-active');

	}

	if ( packetPart != null ) {

		partEdit.classList.add('ds-active');

		partEditIdentifierElt.value = packetPart.identifier;
		partEditTypeElt.value = packetPart.type.identifier;

		currentEditPacketPart = packetPart;
		currentEditPacketPart.element.classList.add('ds-active');

		updatePacketPartLines( utils.getCurrentMillis() + 450 );

	} else {
		partEdit.classList.remove('ds-active');
	}

}

// Apply fields to current edit packet part
function applyEditPacketPartIdentifier() {
	if ( currentEditPacketPart == null ) return;
	currentEditPacketPart.identifier = partEditIdentifierElt.value;
	updatePacketPartLines( utils.getCurrentMillis() + 250 );
}

function applyEditPacketPartType() {
	if ( currentEditPacketPart == null ) return;
	currentEditPacketPart.type = Type.Enum.fromIdentifier( partEditTypeElt.value );
	updatePacketPartLines( utils.getCurrentMillis() + 250 );
}

// Update edit packet part lines
function updatePacketPartLines( until ) {

	if ( currentEditPacketPart == null ) return;

	let svgWidth = partEdit.offsetWidth;
	let svgHeight = parseFloat( partEditLinesElt.getAttribute('height') );

	partEditLinesElt.setAttribute( 'width', svgWidth );

	let leftLine = partEditLinesElt.querySelector('line.ds-left');
	let rightLine = partEditLinesElt.querySelector('line.ds-right');

	let partBoxPositions = utils.getBoxPositions( currentEditPacketPart.element );
	let partEditBoxPositions = utils.getBoxPositions( partEdit );

	leftLine.setAttribute( 'x1', 0 );
	leftLine.setAttribute( 'y1', svgHeight );
	leftLine.setAttribute( 'x2', partBoxPositions.top_left.x - partEditBoxPositions.bottom_left.x );
	leftLine.setAttribute( 'y2', 0 );

	rightLine.setAttribute( 'x1', svgWidth );
	rightLine.setAttribute( 'y1', svgHeight );
	rightLine.setAttribute( 'x2', partBoxPositions.top_right.x - partEditBoxPositions.bottom_right.x + svgWidth );
	rightLine.setAttribute( 'y2', 0 );

	if ( until !== undefined && until > utils.getCurrentMillis() ) {

		setTimeout( () => {
			updatePacketPartLines( until );
		}, 10 );

	}

}

// Type Select
let typesSelect = document.querySelector('select#ds-packet-part-edit-type');
typesSelect.innerHTML = "";

$.each( Type.Enum, ( idx, type ) => {

	let optionElt = document.createElement('option');
	optionElt.setAttribute( 'value', type.identifier );
	optionElt.textContent = type.name;
	typesSelect.appendChild( optionElt );

} );

// Test \\
let packet = new Packet();
packet.parts.push( new PacketPart( "Test unsigned byte", Type.Enum.UNSIGNED_INT_8 ) );
packet.parts.push( new PacketPart( "Test integer 32",  Type.Enum.INT_32 ) );
packet.parts.push( new PacketPart( "Test unsigned int 16", Type.Enum.UNSIGNED_INT_16 ) );
drawPacketInDiagram( packet );
// ---- \\

module.exports = {
	Packet: Packet,
	PacketPart: PacketPart
};
