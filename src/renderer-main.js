
const { ipcRenderer, remote } = require('electron');
const utils = require('./utils');

// Serial
const serialDiv = document.querySelector('div.serial');
const serialPortSelect = serialDiv.querySelector('select#serial-port');
const serialPortNoPortOption = serialPortSelect.querySelector('option');
const serialBaudrateSelect = serialDiv.querySelector('select#serial-baudrate');
const serialConnectButton = serialDiv.querySelector('button#serial-connect');

serialConnectButton.addEventListener( 'click', () => {
	requestSerialConnect();
} );

let serialPortsOptions = {};
let serialState = 'no_port';

function updateSerialBaudratesList( baudrates, defaultBaudrate ) {

	serialBaudrateSelect.innerHTML = '';

	for ( let i in baudrates ) {

		let baudrate = baudrates[ i ];

		let baudrateOption = document.createElement('option');
		baudrateOption.setAttribute( 'value', baudrate );
		baudrateOption.textContent = `${baudrate}`;
		serialBaudrateSelect.appendChild( baudrateOption );

	}

	serialBaudrateSelect.value = `${defaultBaudrate}`;

}

function initSerialPortsList( ports ) {

	serialPortSelect.innerHTML = '';
	serialPortsOptions = {};

	for ( let i in ports ) {

		let port = ports[ i ];

		addSerialPort( port );

	}

}

function addSerialPort( port ) {

	if ( serialPortsOptions[ port ] !== undefined ) return;

	let portOption = document.createElement('option');
	portOption.setAttribute( 'value', port );
	portOption.textContent = port;
	serialPortSelect.appendChild( portOption );

	serialPortsOptions[ port ] = portOption;

}

function removeSerialPort( port ) {

	if ( serialPortsOptions[ port ] === undefined ) return;

	serialPortsOptions[ port ].remove();
	delete serialPortsOptions[ port ];

}

function updateSerialElements() {

	let noPort = false;
	let connected = false;

	switch ( serialState ) {
		case 'no_port':
			noPort = true;
		case 'waiting':
			serialConnectButton.textContent = 'Connection';
			break;
		case 'connected':
			serialConnectButton.textContent = 'Disconnect';
			connected = true;
			break;
	}

	if ( noPort ) {

		serialPortSelect.innerHTML = '';
		serialPortSelect.appendChild( serialPortNoPortOption );
		serialPortSelect.classList.add('disabled');

		serialConnectButton.classList.add('disabled');

	} else {

		serialPortNoPortOption.remove();

		if ( connected ) {

			serialPortSelect.classList.add('disabled');
			serialBaudrateSelect.classList.add('disabled');
			serialConnectButton.classList.remove('disabled');

			serialConnectButton.classList.remove('info');
			serialConnectButton.classList.add('danger');

			consoleDiv.classList.add('active');

		} else {

			serialBaudrateSelect.classList.remove('disabled');
			serialPortSelect.classList.remove('disabled');
			serialConnectButton.classList.remove('disabled');

			serialConnectButton.classList.add('info');
			serialConnectButton.classList.remove('danger');

			consoleDiv.classList.remove('active');

		}

	}

}

function requestSerialConnect() {

	if ( serialState === 'waiting' ) {
		ipcRenderer.send( 'serial-connect', serialPortSelect.value, parseInt( serialBaudrateSelect.value ) );
	} else if ( serialState === 'connected' ) {
		ipcRenderer.send( 'serial-disconnect' );
	}

}

ipcRenderer.on( 'serial-baudrates-list', ( event, baudrates, defaultBaudrate ) => {
	updateSerialBaudratesList( baudrates, defaultBaudrate );
} );

ipcRenderer.on( 'serial-ports-init', ( event, ports ) => {
	initSerialPortsList( ports );
} );

ipcRenderer.on( 'serial-port-add', ( event, port ) => {
	addSerialPort( port );
} );

ipcRenderer.on( 'serial-port-remove', ( event, port ) => {
	removeSerialPort( port );
} );

ipcRenderer.on( 'serial-state', ( event, state ) => {

	serialState = state;
	updateSerialElements();

} );

// Console
const consoleDiv = document.querySelector('div.console');
const consoleBinaryDiv = consoleDiv.querySelector('div.binary');
const consoleTextDiv = consoleDiv.querySelector('div.text');
const consoleTextContentDiv = consoleTextDiv.querySelector('div.content');
const consoleTextInput = consoleTextDiv.querySelector('input');

let consoleScrollLock = false;

consoleTextInput.addEventListener( 'keydown', ( event ) => {
	if ( event.which === 13 ) consoleSend();
} );

function consolePush( bytes ) {

	bytes.forEach( ( byte ) => {

		let binaryByteSpan = document.createElement('span');
		binaryByteSpan.textContent = byte.toString( 16 );
		consoleBinaryDiv.appendChild( binaryByteSpan );

		consoleTextContentDiv.textContent += String.fromCharCode( byte );

	} );

	if ( !consoleScrollLock ) consoleTextContentDiv.scrollTop = consoleTextContentDiv.scrollHeight;

}

function consoleSend() {

	let value = consoleTextInput.value + '\n'; // TODO: Add an option to add or not '\n'

	// Converting text to bytes
	let bytes = [];
	for ( let i = 0; i < value.length; i++ ) {
		bytes.push( value.charCodeAt( i ) );
	}

	// Resetting input
	consoleTextInput.value = "";

	// Send to main process
	ipcRenderer.send( 'console-send', bytes );

}

ipcRenderer.on( 'console-push', ( event, bytes ) => {
	consolePush( bytes );
} );

// Packet
const packetDiv = document.querySelector('div.packet');
const packetDiagramDiv = packetDiv.querySelector('div.diagram');
const packetDiagramAddDiv = packetDiagramDiv.querySelector('div.add');
const packetEditSegmentDiv = packetDiv.querySelector('div.edit-segment');
const packetEditSegmentLinesSvg = packetEditSegmentDiv.querySelector('svg.lines');
const packetEditSegmentLinesLeft = packetEditSegmentLinesSvg.querySelector('line.left');
const packetEditSegmentLinesRight = packetEditSegmentLinesSvg.querySelector('line.right');
const packetEditSegmentIdentifierInput = packetEditSegmentDiv.querySelector('input#packet-edit-segment-identifier');
const packetEditSegmentTypeSelect = packetEditSegmentDiv.querySelector('select#packet-edit-segment-type');
const packetEditSegmentRemoveButton = packetEditSegmentDiv.querySelector('button#packet-edit-segment-remove');
const packetEditSegmentCloseButton = packetEditSegmentDiv.querySelector('button#packet-edit-segment-close');

packetDiagramAddDiv.addEventListener( 'click', () => {
	requestNewSegment();
} );

packetEditSegmentCloseButton.addEventListener( 'click', () => {
	editPacketSegment( null );
} );

packetEditSegmentRemoveButton.addEventListener( 'click', () => {
	removeEditingPacketSegment();
} );

packetEditSegmentIdentifierInput.addEventListener( 'keyup', () => {
	applyEditingSegmentIdentifier();
} );

packetEditSegmentTypeSelect.addEventListener( 'change', () => {
	applyEditingSegmentType();
} );

window.addEventListener( 'resize', () => {
	updateEditSegmentLines();
} );

let packetSegmentsElements = {};
let editingPacketSegmentUid = null;

function updatePacketSegmentDataTypes( types ) {

	packetEditSegmentTypeSelect.innerHTML = '';

	for ( let i in types ) {

		let type = types[ i ];

		let typeOption = document.createElement('option');
		typeOption.setAttribute( 'value', type.identifier );
		typeOption.textContent = type.name;
		packetEditSegmentTypeSelect.appendChild( typeOption );

	}

}

function initPacketSegments( segments ) {

	packetDiagramDiv.innerHTML = '';
	packetDiagramDiv.appendChild( packetDiagramAddDiv );
	packetSegmentsElements = {};

	for ( let i in segments ) {

		let segment = segments[ i ];

		addPacketSegment( segment.uid, segment.name, segment.size );

	}

	updatePacketDiagramAdd();

}

function addPacketSegment( uid, name, size, anim = false ) {

	if ( packetSegmentsElements[ uid ] !== undefined ) return;

	let segmentElement = document.createElement('div');
	let segmentNameElement = document.createElement('div');
	let segmentRuleElement = document.createElement('div');
	let segmentSizeElement = document.createElement('div');
	let segmentValueElement = document.createElement('div');

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

	segmentValueElement.classList.add('value');
	segmentElement.appendChild( segmentValueElement );

	packetSegmentsElements[ uid ] = {
		element: segmentElement,
		name: segmentNameElement,
		rule: segmentRuleElement,
		size: segmentSizeElement,
		value: segmentValueElement
	};

	packetDiagramDiv.insertBefore( segmentElement, packetDiagramAddDiv );

	updatePacketSegmentName( uid, name );
	updatePacketSegmentValue( uid, 0 );

	if ( anim ) {

		setTimeout( () => {

			updatePacketSegmentSize( uid, size );
			segmentElement.style.opacity = '';

		}, 10 );

	} else {

		updatePacketSegmentSize( uid, size );

	}

}

function updatePacketSegmentName( uid, name ) {
	let segmentElements = packetSegmentsElements[ uid ];
	if ( segmentElements !== undefined ) segmentElements.name.textContent = name;
}

function updatePacketSegmentSize( uid, size ) {
	let segmentElements = packetSegmentsElements[ uid ];
	if ( segmentElements !== undefined ) {
		segmentElements.size.textContent = `${size}`;
		segmentElements.element.style.flex = `${size} 0 0`;
	}
}

function updatePacketSegmentValue( uid, value ) {
	let segmentElements = packetSegmentsElements[ uid ];
	if ( segmentElements !== undefined ) segmentElements.value.textContent = `${value}`;
}

function updatePacketDiagramAdd() {
	packetDiagramAddDiv.style.flex = Object.keys( packetSegmentsElements ).length > 0 ? '' : '1 1 0';
}

function editPacketSegment( uid ) {

	if ( editingPacketSegmentUid === uid ) {

		editPacketSegment( null );
		return;

	}

	if ( uid !== null && packetSegmentsElements[ uid ] === undefined ) return;

	if ( editingPacketSegmentUid !== null ) {

		let editingPacketSegmentElements = packetSegmentsElements[ editingPacketSegmentUid ];
		editingPacketSegmentElements.element.classList.remove('active');

	}

	if ( ( editingPacketSegmentUid = uid ) !== null ) {

		let segmentElements = packetSegmentsElements[ editingPacketSegmentUid ];

		ipcRenderer.send( 'packet-segment-details', uid );

		packetEditSegmentIdentifierInput.value = '';
		packetEditSegmentTypeSelect.value = '';

		packetEditSegmentDiv.classList.add('active');
		segmentElements.element.classList.add('active');

		updateEditSegmentLinesAnim( 450 );

	} else {

		packetEditSegmentDiv.classList.remove('active');

	}

}

function updateEditSegmentLinesAnim( millis ) {
	updateEditSegmentLines( utils.getCurrentMillis() + millis );
}

function updateEditSegmentLines( until ) {

	if ( editingPacketSegmentUid === null ) return;

	let editingPacketSegmentElements = packetSegmentsElements[ editingPacketSegmentUid ];

	let width = packetEditSegmentDiv.offsetWidth;
	let height = parseFloat( getComputedStyle( packetDiagramDiv ).marginBottom.replace( 'px', '' ) );

	packetEditSegmentLinesSvg.setAttribute( 'width', width );
	packetEditSegmentLinesSvg.setAttribute( 'height', height );
	packetEditSegmentLinesSvg.style.left = '-1px';
	packetEditSegmentLinesSvg.style.top = ( -height ) + 'px';

	let editingSegmentBox = editingPacketSegmentElements.element.getBoundingClientRect();
	let packetEditBox = packetEditSegmentDiv.getBoundingClientRect();

	packetEditSegmentLinesLeft.setAttribute( 'x1', 0 );
	packetEditSegmentLinesLeft.setAttribute( 'y1', height );
	packetEditSegmentLinesLeft.setAttribute( 'x2', editingSegmentBox.left - packetEditBox.left );
	packetEditSegmentLinesLeft.setAttribute( 'y2', 0 );

	packetEditSegmentLinesRight.setAttribute( 'x1', width );
	packetEditSegmentLinesRight.setAttribute( 'y1', height );
	packetEditSegmentLinesRight.setAttribute( 'x2', ( editingSegmentBox.left + editingSegmentBox.width ) - ( packetEditBox.left + packetEditBox.width ) + width );
	packetEditSegmentLinesRight.setAttribute( 'y2', 0 );

	if(  until !== undefined && until > utils.getCurrentMillis() ) {

		setTimeout( updateEditSegmentLines, 10, until );

	}

}

function applyEditingSegmentIdentifier() {
	if ( editingPacketSegmentUid === null ) return;
	ipcRenderer.send( 'packet-segment-identifier', editingPacketSegmentUid, packetEditSegmentIdentifierInput.value );
}

function applyEditingSegmentType() {
	if ( editingPacketSegmentUid === null ) return;
	ipcRenderer.send( 'packet-segment-type', editingPacketSegmentUid, packetEditSegmentTypeSelect.value );
	updateEditSegmentLinesAnim( 450 );
}

function requestNewSegment() {
	ipcRenderer.send( 'packet-segment-add' );
}

function newPacketSegment( uid, name, size) {

	addPacketSegment( uid, name, size, true );
	editPacketSegment( uid );
	updatePacketDiagramAdd();

}

function removeEditingPacketSegment() {
	if ( editingPacketSegmentUid === null ) return;
	requestRemovePacketSegment( editingPacketSegmentUid );
}

function requestRemovePacketSegment( uid ) {
	ipcRenderer.send( 'packet-segment-remove', uid );
}

function removePacketSegment( uid ) {

	if ( editingPacketSegmentUid === uid ) editPacketSegment( null );

	let element = packetSegmentsElements[ uid ].element;
	delete packetSegmentsElements[ uid ];

	element.style.flex = '0 0 0';
	element.style.opacity = '0';

	setTimeout( () => {

		element.remove();
		updatePacketDiagramAdd();

	}, 250 );

}

ipcRenderer.on( 'packet-segments-init', ( event, segments ) => {
	initPacketSegments( segments );
} );

ipcRenderer.on( 'packet-segment-add', ( event, uid, name, size ) => {
	newPacketSegment( uid, name, size );
} );

ipcRenderer.on( 'packet-segment-remove', ( event, uid ) => {
	removePacketSegment( uid );
} );

ipcRenderer.on( 'packet-segment-name', ( event, uid, name ) => {
	updatePacketSegmentName( uid, name );
} );

ipcRenderer.on( 'packet-segment-size', ( event, uid, size ) => {
	updatePacketSegmentSize( uid, size );
} );

ipcRenderer.on( 'packet-segment-details', ( event, identifier, type, defaultName ) => {

	packetEditSegmentIdentifierInput.value = identifier;
	packetEditSegmentIdentifierInput.placeholder = defaultName;
	packetEditSegmentTypeSelect.value = type;

} );

ipcRenderer.on( 'packet-segment-value', ( event, uid, value ) => {
	updatePacketSegmentValue( uid, value );
} );

ipcRenderer.on( 'packet-segment-data-types-list', ( event, types ) => {
	updatePacketSegmentDataTypes( types );
} );

// Readers
const readerDiv = document.querySelector('div.reader');
const readerGraphButton = readerDiv.querySelector('button#reader-graph');

readerGraphButton.addEventListener( 'click', () => {

	ipcRenderer.send( 'reader-graph-visible-toggle' );

} );

function setReaderGraphVisible( visible ) {

	if ( visible ) {

		readerGraphButton.textContent = 'Hide graph';
		readerGraphButton.classList.remove('info');
		readerGraphButton.classList.add('danger');

	} else {

		readerGraphButton.textContent = 'Show graph';
		readerGraphButton.classList.add('info');
		readerGraphButton.classList.remove('danger');

	}

}

ipcRenderer.on( 'reader-graph-visible', ( event, visible ) => {
	setReaderGraphVisible( visible );
} );

// Reload ( F5 °116 ) and dev tools ( F12 °123 )
document.addEventListener( 'keydown', ( e ) => {

	switch ( e.which ) {
		case 123:
			remote.getCurrentWindow().toggleDevTools();
			break;
		case 116:
			location.reload();
			break;
	}

} );

// Register this renderer
ipcRenderer.send( 'register-renderer', 'main' );
