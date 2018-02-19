/**
 * Renderer paquet manager
 */

const Type = require('../type').Type;
const utils = require('../utils');
const $ = require('jquery');
const jsonfile = require('jsonfile');

// Packet elements and events
const packetDiv = document.querySelector('div.ds-packet');
const packetPartEditDiv = packetDiv.querySelector('div.ds-part-edit');
const packetPartEditLinesSvg = packetPartEditDiv.querySelector('svg.ds-lines');
const packetPartEditLinesSvgLeftLine = packetPartEditLinesSvg.querySelector('line.ds-left');
const packetPartEditLinesSvgRightLine = packetPartEditLinesSvg.querySelector('line.ds-right');
const packetPartEditIdentifierInput = packetPartEditDiv.querySelector('input#ds-packet-part-edit-identifier');
const packetPartEditTypeSelect = packetPartEditDiv.querySelector('select#ds-packet-part-edit-type');
const packetPartEditCloseButton = packetPartEditDiv.querySelector('div.ds-close');
const packetPartEditRemoveButton = packetPartEditDiv.querySelector('button#ds-packet-part-edit-remove');

packetPartEditIdentifierInput.addEventListener( 'keyup', () => {
	applyEditPacketPartIdentifier();
} );

packetPartEditTypeSelect.addEventListener( 'change', () => {
	applyEditPacketPartType();
} );

packetPartEditCloseButton.addEventListener( 'click', () => {
	editPacketPart( null );
} );

packetPartEditRemoveButton.addEventListener( 'click', () => {
	removeEditingPart();
} );

window.addEventListener( 'resize', () => {
	updatePacketPartLines();
} );

// Init type select
packetPartEditTypeSelect.innerHTML = "";

$.each( Type.Enum, ( idx, type ) => {

	let option = document.createElement('option');
	option.setAttribute( 'value', type.identifier );
	option.textContent = type.name;
	packetPartEditTypeSelect.appendChild( option );

} );

// Classes
class Packet {

	constructor( identifier ) {

		this.identifier = identifier;

		this.parts = [];

		this.element = document.createElement('div');
		this.element.classList.add('ds-diagram');

		this.addButton = document.createElement('div');
		this.addButton.classList.add('ds-add');
		this.addButton.textContent = '+';

		this.addButton.addEventListener( 'click', () => {

			this.addPart( "identifier_" + this.parts.length, Type.Enum.UNSIGNED_INT_8 );

		} );

		this.updateAddButton();

	}

	initDiagram() {

		this.element.innerHTML = "";

		this.parts.forEach( part => {

			this.element.appendChild( part.element );

		} );

		this.element.appendChild( this.addButton );

	}

	updateAddButton() {

		if ( this.parts.length === 0 ) {
			this.addButton.style.flex = "1 1 0";
		} else {
			this.addButton.style.flex = "";
		}

	}

	addPart( identifier, type ) {

		let part = new PacketPart( identifier, type );

		this.parts.push( part );

		part.element.style.flex = "0 0 0";
		this.element.insertBefore( part.element, this.addButton );

		setTimeout( () => {
			part.element.style.flex = "1 0 0";
		}, 10 );

		updatePacketPartLinesAnim( 250 );
		this.updateAddButton();

	}

	removePart( part ) {

		part.element.style.flex = "0 0 0";

		utils.removeFromArray( this.parts, part );

		setTimeout( () => {
			part.element.remove();
		}, 200 );

		updatePacketPartLinesAnim( 250 );
		this.updateAddButton();

	}

}

class PacketPart {

	constructor( identifier, type ) {

		if ( !( type instanceof Type ) ) throw new TypeError("Invalid 'type' argument, must be a Type object");

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

		this._identifier = identifier;
		this.identifierElement.textContent = this.name;
		this.element.setAttribute( 'title', this.name );

	}

	get identifier() {
		return this._identifier;
	}

	get name() {
		return this._identifier || this._type.name;
	}

	set type( type ) {

		this._type = type;
		this.ruleSizeElement.textContent = this._type.size + ' byte' + ( this._type.size > 1 ? 's' : '' );
		this.ruleTypeElement.textContent = this._type.name;
		this.updateFlex();

	}

	get type() {
		return this._type;
	}

	updateFlex() {
		this.element.style.flex = `${this._type.size} 0 0`;
	}

	setActive( active ) {
		this.element.classList[ active ? "add" : "remove" ]('ds-active');
	}

}

// Current packet and editing packet part
let currentPacket = null;
let editingPacketPart = null;

// Save and load packets from save
function savePackets() {

	let json = [];



}

// Set current packet
function setCurrentPacket( packet ) {

	if ( !( packet instanceof Packet ) ) throw new TypeError("Invalid 'packet' argument, must be a Packet");

	let currentDiagram = packetDiv.querySelector('div.ds-diagram');
	if ( currentDiagram != null ) currentDiagram.remove();

	currentPacket = packet;

	packet.initDiagram();

	packetDiv.insertBefore( packet.element, packetPartEditDiv );

}

// Edit packet part
function editPacketPart( part ) {

	if ( editingPacketPart === part ) return;

	if ( editingPacketPart !== null ) {
		editingPacketPart.setActive( false );
	}

	if ( ( editingPacketPart = part ) instanceof PacketPart ) {

		packetPartEditIdentifierInput.value = editingPacketPart.identifier;
		packetPartEditTypeSelect.value = editingPacketPart.type.identifier;

		editingPacketPart.setActive( true );
		packetPartEditDiv.classList.add('ds-active');

		updatePacketPartLinesAnim( 450 );

	} else {

		packetPartEditDiv.classList.remove('ds-active');

	}

}

function applyEditPacketPartIdentifier() {
	if ( editingPacketPart === null ) return;
	editingPacketPart.identifier = packetPartEditIdentifierInput.value;
}

function applyEditPacketPartType() {
	if ( editingPacketPart === null ) return;
	editingPacketPart.type = Type.Enum.fromIdentifier( packetPartEditTypeSelect.value );
	updatePacketPartLinesAnim( 250 );
}

function removeEditingPart() {
	if ( editingPacketPart === null || currentPacket === null ) return;
	currentPacket.removePart( editingPacketPart );
	editPacketPart( null );
}

// Packet part zoom lines
function updatePacketPartLinesAnim( millis ) {
	updatePacketPartLines( utils.getCurrentMillis() + millis );
}

function updatePacketPartLines( until ) {

	if ( editingPacketPart == null ) return;

	let svgWidth = packetPartEditDiv.offsetWidth;
	let svgHeight = parseFloat( packetPartEditLinesSvg.getAttribute('height') );
	packetPartEditLinesSvg.setAttribute( 'width', svgWidth );

	let partBoxPositions = utils.getBoxPositions( editingPacketPart.element );
	let partEditBoxPositions = utils.getBoxPositions( packetPartEditDiv );

	packetPartEditLinesSvgLeftLine.setAttribute( 'x1', 0 );
	packetPartEditLinesSvgLeftLine.setAttribute( 'y1', svgHeight );
	packetPartEditLinesSvgLeftLine.setAttribute( 'x2', partBoxPositions.top_left.x - partEditBoxPositions.bottom_left.x );
	packetPartEditLinesSvgLeftLine.setAttribute( 'y2', 0 );

	packetPartEditLinesSvgRightLine.setAttribute( 'x1', svgWidth );
	packetPartEditLinesSvgRightLine.setAttribute( 'y1', svgHeight );
	packetPartEditLinesSvgRightLine.setAttribute( 'x2', partBoxPositions.top_right.x - partEditBoxPositions.bottom_right.x + svgWidth );
	packetPartEditLinesSvgRightLine.setAttribute( 'y2', 0 );

	if ( until !== undefined && until > utils.getCurrentMillis() ) {

		setTimeout( () => {
			updatePacketPartLines( until );
		}, 10 );

	}

}

// Test
let packet = new Packet("test_packet");
setCurrentPacket( packet );

module.exports = {
	Packet: Packet,
	PacketPart: PacketPart
};
