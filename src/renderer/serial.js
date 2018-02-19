/**
 * Renderer serial manager
 */

// Requires
const SerialPort = require('serialport');
const utils = require('../utils');

// Serial elements and events
const serialDiv = document.querySelector('div.ds-serial');
const serialConnectionDiv = serialDiv.querySelector('div.ds-serial-connection');
const serialBaudrateSelect = serialConnectionDiv.querySelector('select#ds-serial-baudrate');
const serialPortSelect = serialConnectionDiv.querySelector('select#ds-serial-port');
const serialConnectedDiv = serialDiv.querySelector('div.ds-serial-connected');
const serialConnectButton = serialDiv.querySelector('button#ds-serial-connect');

serialConnectButton.addEventListener( 'click', () => {

	if ( connectState === ConnectState.CONNECTED || openedPort !== null ) {
		disconnect();
	} else {
		connect();
	}

} );

// Possible baudrates
const BAUDRATES = [ 110, 300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 28800, 38400, 56000, 57600, 115200 ];
const INITIAL_BAUDRATE = 115200;

serialBaudrateSelect.innerHTML = "";

BAUDRATES.forEach( baudrate => {

	let baudrateOption = document.createElement('option');
	baudrateOption.setAttribute( 'value', baudrate );
	baudrateOption.textContent = `${baudrate}`;
	serialBaudrateSelect.appendChild( baudrateOption );

} );

serialBaudrateSelect.value = INITIAL_BAUDRATE;

// Availables ports
let availablePorts = [];

function updateAvailablePorts() {

	if ( connectState !== ConnectState.CONNECTION ) return;

	SerialPort.list( ( err, newPorts ) => {

		if ( err ) {

			console.error( err.message );
			return;

		}

		if ( newPorts.length > 0 ) {

			if ( availablePorts.length === 0 ) serialPortSelect.innerHTML = "";

			let children = serialPortSelect.childNodes;

			serialPortSelect.classList.remove('ds-disabled');
			serialConnectButton.classList.remove('ds-disabled');

			let dif = utils.arrayDif( availablePorts, newPorts, ( port1, port2 ) => {
				return port1.comName === port2.comName;
			}, addedPort => {

				let elt = document.createElement("option");
				elt.setAttribute( 'value', addedPort.comName );
				elt.textContent = addedPort.comName;
				serialPortSelect.appendChild( elt );

			}, removedPort => {

				children.forEach( child => {
					if ( child.getAttribute("value") === addedPort.comName ) child.remove();
				} );

			} );

		} else {

			serialPortSelect.classList.add('ds-disabled');
			serialConnectButton.classList.add('ds-disabled');
			serialPortSelect.innerHTML = "";

			let elt = document.createElement("option");
			elt.textContent = "No serial port";

			serialPortSelect.appendChild( elt );

		}

		availablePorts = newPorts;

	} );

}

// Connection
const ConnectState = {
	CONNECTION: 0,
	INVALID_PORT: 1,
	INVALID_BAUDRATE: 2,
	CONNECTING: 3,
	CONNECT_FAILED: 4,
	CONNECTED: 5
};

let openedPort = null;
let connectState = null;

function connect() {

	if ( connectState !== ConnectState.CONNECTION || availablePorts.length === 0 ) return;

	// Getting fields values
	let port = serialPortSelect.value;
	let baudrate = parseInt( serialBaudrateSelect.value );

	// Checking validity of fields values
	let validPort = false;
	availablePorts.forEach( availablePort => {
		if ( validPort ) return;
		if ( availablePort.comName === port ) validPort = true;
	} );

	if ( !validPort ) {

		setConnectState( ConnectState.INVALID_PORT );
		return;

	}

	if ( BAUDRATES.indexOf( baudrate ) === -1 ) {

		setConnectState( ConnectState.INVALID_BAUDRATE );
		return;

	}

	// Connecting ...
	setConnectState( ConnectState.CONNECTING );

	openedPort = new SerialPort( port, {
		baudRate: baudrate
	}, err => {

		if ( err ) {

			// Connection failed
			setConnectState( ConnectState.CONNECT_FAILED );
			return;

		}

		// Succesfuly connected
		setConnectState( ConnectState.CONNECTED );

		openedPort.write( 'test', err => {
			if ( err ) {
				console.log( err );
			}
		} );

	} );

	openedPort.on( 'error', err => {

		console.log( "Serial port error : " + err.name + " - " + err.message );

	} );

	openedPort.on( 'data', data => {
		console.log( "Data received : ", data.toString('ascii') );
	} );

	/*
	openedPort.on( 'readable', () => {
		console.log( "Data readed : ", data.read() );
	} );
	*/

}

function disconnect() {

	if ( connectState !== ConnectState.CONNECTED || openedPort === null ) return;

	openedPort.close();

	openedPort = null;

	setConnectState( ConnectState.CONNECTION );

}

function setConnectState( state ) {

	let disable = false;
	let reset = false;
	let connected = false;

	switch ( connectState = state ) {
		case ConnectState.CONNECTION:
			serialConnectButton.textContent = "Connection";
			break;
		case ConnectState.INVALID_PORT:
			serialConnectButton.textContent = "Unavailable port";
			disable = true;
			reset = true;
			break;
		case ConnectState.INVALID_BAUDRATE:
			serialConnectButton.textContent = "Invalid baudrate";
			disable = true;
			reset = true;
			break;
		case ConnectState.CONNECTING:
			serialConnectButton.textContent = "Connecting ...";
			disable = true;
			break;
		case ConnectState.CONNECT_FAILED:
			serialConnectButton.textContent = "Connection failed";
			disable = true;
			reset = true;
			break;
		case ConnectState.CONNECTED:
			serialConnectButton.textContent = "Disconnect";
			connected = true;
			break;
	}

	serialConnectButton.classList[ disable ? "add" : "remove" ]('ds-disabled');

	serialConnectionDiv.style.display = connected ? "none" : "block";
	serialConnectedDiv.style.display = connected ? "block" : "none";

	if ( reset ) {

		setTimeout( () => {
			setConnectState( ConnectState.CONNECTION );
		}, 1000 );

	}

}

// Update ports loop
setConnectState( ConnectState.CONNECTION );
updateAvailablePorts();
setInterval( updateAvailablePorts, 5000 );

// Exports
module.exports = {
	availablePorts: availablePorts
};
