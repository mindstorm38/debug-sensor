// Serial renderer script

// Requires
const electron = require('electron');
const ipc = electron.ipcRenderer;
const utils = require('../common/utils');
const serial = require('../common/serial');

// Elements
const serialElement = document.querySelector('div.serial');
const serialBaudrateElement = serialElement.querySelector('select#serial-baudrate');
const serialPortElement = serialElement.querySelector('select#serial-port');
const serialConnectElement = serialElement.querySelector('button#serial-connect');

serialConnectElement.addEventListener( 'click', () => {
	connect();
} );

// No port option element
const serialPortNoPortOptionElement = document.createElement('option');
serialPortNoPortOptionElement.textContent = 'No serial port';

// Init availables baudrates
serialBaudrateElement.innerHTML = '';
for ( let i in serial.BAUDRATES ) {
	let baudrate = serial.BAUDRATES[ i ];
	let baudrateOptionElement = document.createElement('option');
	baudrateOptionElement.setAttribute( 'value', `${baudrate}` );
	baudrateOptionElement.textContent = `${baudrate}`;
	serialBaudrateElement.appendChild( baudrateOptionElement );
}
serialBaudrateElement.value = `${serial.INITIAL_BAUDRATE}`;

// Ports manipulation
let portsCount = 0;
let currentSerialPortElement = {};

function initPorts( ports ) {

	// Removing all ports options
	serialPortElement.innerHTML = '';
	portsCount = 0;

	// Initialize ports
	for ( let i in ports ) {

		let port = ports[ i ];

		addPortElement( port );

	}

	updatePortElement();

}

function addPortElement( port ) {

	if ( currentSerialPortElement[ port ] !== undefined ) return;

	if ( portsCount === 0 ) serialPortElement.innerHTML = '';

	let portOptionElement = document.createElement('option');
	portOptionElement.setAttribute( 'value', port );
	portOptionElement.textContent = port;

	currentSerialPortElement[ port ] = portOptionElement;

	serialPortElement.appendChild( portOptionElement );

	portsCount++;

	updatePortElement();

}

function removePortElement( port ) {

	currentSerialPortElement[ port ].remove();
	delete currentSerialPortElement[ port ];

	portsCount--;

	updatePortElement();

}

function updatePortElement() {

	if ( serialPortElement.childNodes.length === 0 ) {

		serialPortElement.innerHTML = '';
		serialPortElement.appendChild( serialPortNoPortOptionElement );
		serialPortElement.classList.add('disabled');

	} else {

		serialPortElement.classList.remove('disabled');

	}

}

function connect() {

	let port = serialPortElement.value;
	let baudrate = parseInt( serialBaudrateElement.value );

	ipc.send( 'serial-connect', port, baudrate );

}

ipc.on( 'serial-port-init', ( event, ports ) => {
	initPorts( ports );
} );

ipc.on( 'serial-port-add', ( event, port ) => {
	addPortElement( port );
} );

ipc.on( 'serial-port-remove', ( event, port ) => {
	removePortElement( port );
} );

ipc.on( 'serial-state', ( event, state ) => {

} );
