// Packet diagram renderer script

// Requires
const electron = require('electron');
const ipc = electron.ipcRenderer;
const utils = require('../common/utils');
const packet = require('../common/packet');
const Type = packet.Type;
const Packet = packet.Packet;

// Elements
const packetElement = document.querySelector('div.packet');
const packetDiagramElement = packetElement.querySelector('div.diagram');
const packetDiagramAddElement = packetDiagramElement.querySelector('div.add');
// const packetDiagramSofElement = packetDiagramElement.querySelector('div.sof');
// const packetDiagramEofElement = packetDiagramElement.querySelector('div.eof');
const packetEditSegmentElement = packetElement.querySelector('div.edit-segment');
const packetEditSegmentIdentifierElement = packetEditSegmentElement.querySelector('input#packet-edit-segment-identifier');
const packetEditSegmentTypeElement = packetEditSegmentElement.querySelector('select#packet-edit-segment-type');
const packetEditSegmentRemoveElement = packetEditSegmentElement.querySelector('button#packet-edit-segment-remove');
const packetEditSegmentCloseElement = packetEditSegmentElement.querySelector('button#packet-edit-segment-close');
const packetEditSegmentLinesElement = packetEditSegmentElement.querySelector('svg.lines');
const packetEditSegmentLineLeftElement = packetEditSegmentLinesElement.querySelector('line.left');
const packetEditSegmentLineRightElement = packetEditSegmentLinesElement.querySelector('line.right');

packetDiagramAddElement.addEventListener( 'click', () => {
	requestNewSegment();
} );

packetEditSegmentIdentifierElement.addEventListener( 'keyup', () => {
	applyEditingSegmentIdentifier();
} );

packetEditSegmentTypeElement.addEventListener( 'change', () => {
	applyEditingSegmentType();
} );

packetEditSegmentRemoveElement.addEventListener( 'click', () => {
	removeEditingSegment();
} );

packetEditSegmentCloseElement.addEventListener( 'click', () => {
	editPacketSegment( null );
} );

window.addEventListener( 'resize', () => {
	updateEditSegmentLines();
} );

// Init edit segment type select element
packetEditSegmentTypeElement.innerHTML = '';
for ( let i in Type ) {
	let elt = Type[ i ];
	if ( elt instanceof Type ) {
		let typeOptionElement = document.createElement('option');
		typeOptionElement.setAttribute( 'value', elt.identifier );
		typeOptionElement.textContent = elt.name;
		packetEditSegmentTypeElement.appendChild( typeOptionElement );
	}
}

// Elements and packet manipulation
let currentPacketSegmentElements = {};
let editingPacketSegmentUid = null;

function packetSegmentInit( segments ) {

	// Removing all active segments
	packetDiagramElement.innerHTML = "";
	packetDiagramElement.appendChild( packetDiagramAddElement );
	// packetDiagramElement.appendChild( packetDiagramSofElement );
	// packetDiagramElement.appendChild( packetDiagramEofElement );
	currentPacketSegmentElements = {};

	// Initialize segments
	for ( let i in segments ) {

		let segment = segments[ i ];

		addSegmentElement( segment.uid, segment.name, segment.size );

	}

	// Update add button
	updatePacketDiagramAdd();

}

function addSegmentElement( uid, name, size, anim ) {

	if ( currentPacketSegmentElements[ uid ] !== undefined ) return;

	anim = anim || false;

	let segmentElement = document.createElement('div');
	let segmentNameElement = document.createElement('div');
	let segmentRuleElement = document.createElement('div');
	let segmentSizeElement = document.createElement('div');

	segmentElement.setAttribute( 'data-uid', uid );
	segmentElement.classList.add('segment');

	if ( anim ) {

		segmentElement.style.flex = '0 0 0';
		segmentElement.style.opacity = '0';

	}

	segmentElement.addEventListener( 'click', () => {
		editPacketSegment( uid );
	} );

	segmentNameElement.classList.add('name');
	segmentElement.appendChild( segmentNameElement );

	segmentRuleElement.classList.add('rule');
	segmentElement.appendChild( segmentRuleElement );

	segmentSizeElement.classList.add('size');
	segmentRuleElement.appendChild( segmentSizeElement );

	currentPacketSegmentElements[ uid ] = {
		element: segmentElement,
		name: segmentNameElement,
		rule: segmentRuleElement,
		size: segmentSizeElement
	};

	packetDiagramElement.insertBefore( segmentElement, packetDiagramAddElement );

	updateSegmentName( uid, name );

	if ( anim ) {

		setTimeout( () => {

			updateSegmentSize( uid, size );
			segmentElement.style.opacity = '';

		}, 10 );

	} else {

		updateSegmentSize( uid, size );

	}

}

function updateSegmentName( uid, name ) {
	let segmentElements = currentPacketSegmentElements[ uid ];
	if ( segmentElements !== undefined ) segmentElements.name.textContent = name;
}

function updateSegmentSize( uid, size ) {
	let segmentElements = currentPacketSegmentElements[ uid ];
	if ( segmentElements !== undefined ) {
		segmentElements.size.textContent = `${size}`;
		segmentElements.element.style.flex = `${size} 0 0`;
	}
}

function updatePacketDiagramAdd() {
	packetDiagramAddElement.style.flex = ( packetDiagramElement.querySelectorAll('div.segment').length > 0 ) ? '' : '1 1 0';
}

function editPacketSegment( uid ) {

	if ( editingPacketSegmentUid === uid ) return;

	if ( uid !== null && currentPacketSegmentElements[ uid ] === undefined ) return;

	if ( editingPacketSegmentUid !== null ) {

		let editingPacketSegmentElements = currentPacketSegmentElements[ editingPacketSegmentUid ];
		editingPacketSegmentElements.element.classList.remove('active');

	}

	if ( ( editingPacketSegmentUid = uid ) !== null ) {

		let segmentElements = currentPacketSegmentElements[ editingPacketSegmentUid ];

		ipc.send( 'packet-segment-details', uid );

		packetEditSegmentIdentifierElement.value = '';
		packetEditSegmentTypeElement.value = '';

		packetEditSegmentElement.classList.add('active');
		segmentElements.element.classList.add('active');

		updateEditSegmentLinesAnim( 450 );

	} else {

		packetEditSegmentElement.classList.remove('active');

	}

}

function updateEditSegmentLinesAnim( millis ) {
	updateEditSegmentLines( utils.getCurrentMillis() + millis );
}

function updateEditSegmentLines( until )  {

	if ( editingPacketSegmentUid === null ) return;

	let editingSegmentElements = currentPacketSegmentElements[ editingPacketSegmentUid ];

	let width = packetEditSegmentElement.offsetWidth;
	let height = parseFloat( getComputedStyle( packetDiagramElement ).marginBottom.replace( 'px', '' ) ) + 2;

	packetEditSegmentLinesElement.setAttribute( 'width', width );
	packetEditSegmentLinesElement.setAttribute( 'height', height );
	packetEditSegmentLinesElement.style.left = '-1px';
	packetEditSegmentLinesElement.style.top = ( -height ) + 'px';

	let editingSegmentBox = editingSegmentElements.element.getBoundingClientRect();
	let packetEditBox = packetEditSegmentElement.getBoundingClientRect();

	packetEditSegmentLineLeftElement.setAttribute( 'x1', 0 );
	packetEditSegmentLineLeftElement.setAttribute( 'y1', height );
	packetEditSegmentLineLeftElement.setAttribute( 'x2', editingSegmentBox.left - packetEditBox.left );
	packetEditSegmentLineLeftElement.setAttribute( 'y2', 0 );

	packetEditSegmentLineRightElement.setAttribute( 'x1', width );
	packetEditSegmentLineRightElement.setAttribute( 'y1', height );
	packetEditSegmentLineRightElement.setAttribute( 'x2', ( editingSegmentBox.left + editingSegmentBox.width ) - ( packetEditBox.left + packetEditBox.width ) + width );
	packetEditSegmentLineRightElement.setAttribute( 'y2', 0 );

	if ( until !== undefined && until > utils.getCurrentMillis() ) {

		setTimeout( updateEditSegmentLines, 10, until );

	}

}

function applyEditingSegmentIdentifier() {
	if ( editingPacketSegmentUid === null ) return;
	ipc.send( 'packet-segment-identifier', editingPacketSegmentUid, packetEditSegmentIdentifierElement.value );
}

function applyEditingSegmentType() {
	if ( editingPacketSegmentUid === null ) return;
	ipc.send( 'packet-segment-type', editingPacketSegmentUid, packetEditSegmentTypeElement.value );
	updateEditSegmentLinesAnim( 450 );
}

function removeEditingSegment() {
	if ( editingPacketSegmentUid === null ) return;
	requestRemoveSegment( editingPacketSegmentUid );
}

function requestRemoveSegment( uid ) {
	ipc.send( 'packet-segment-remove', uid );
}

function removeSegment( uid ) {

	if ( editingPacketSegmentUid === uid ) editPacketSegment( null );

	let element = currentPacketSegmentElements[ uid ].element;
	delete currentPacketSegmentElements[ uid ];

	element.style.flex = '0 0 0';
	element.style.opacity = '0';

	setTimeout( () => {

		element.remove();
		updatePacketDiagramAdd();

	}, 250 );

}

function addSegment( uid, name, size ) {

	if ( uid === undefined ) {

		ipc.send( 'packet-segment-add' );
		return;

	}

	addSegmentElement( uid, name, size, true );
	editPacketSegment( uid );
	updatePacketDiagramAdd();

}

function requestNewSegment() {
	ipc.send( 'packet-segment-add' );
}

function newSegment( uid, name, size ) {

	addSegmentElement( uid, name, size, true );
	editPacketSegment( uid );
	updatePacketDiagramAdd();

}

ipc.on( 'packet-segment-init', ( event, segments ) => {
	packetSegmentInit( segments );
} );

ipc.on( 'packet-segment-name', ( event, uid, name ) => {
	updateSegmentName( uid, name );
} );

ipc.on( 'packet-segment-size', ( event, uid, size ) => {
	updateSegmentSize( uid, size );
} );

ipc.on( 'packet-segment-details', ( event, uid, details ) => {

	packetEditSegmentIdentifierElement.value = details.identifier;
	packetEditSegmentIdentifierElement.placeholder = details.defaultName;
	packetEditSegmentTypeElement.value = details.type;

} );

ipc.on( 'packet-segment-remove', ( event, uid ) => {
	removeSegment( uid );
} );

ipc.on( 'packet-segment-add', ( event, uid, name, size ) => {
	newSegment( uid, name, size );
} );
