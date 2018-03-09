
const { ipcRenderer, remote } = require('electron');
const utils = require('./utils');

// Console
const consoleBinaryDiv = document.querySelector('div.binary');
const consoleTextDiv = document.querySelector('div.text');
const consoleTextContentDiv = consoleTextDiv.querySelector('div.content');
const consoleTextInputDiv = consoleTextDiv.querySelector('div.input');
const consoleTextInputInput = consoleTextInputDiv.querySelector('input');
const consoleSwitchModeDiv = document.querySelector('div.switch');
const consoleSwitchModeBinaryDiv = consoleSwitchModeDiv.querySelector('div[data-mode="binary"]');
const consoleSwitchModeTextDiv = consoleSwitchModeDiv.querySelector('div[data-mode="text"]');

let consoleScrollLock = false;
let consoleMode = 'text';

window.addEventListener( 'beforeunload', ( event ) => {

	event.returnValue = false;
	ipcRenderer.send( 'renderer-console-request-close' );

} );

consoleTextInputInput.addEventListener( 'keydown', ( event ) => {
	if ( event.which === 13 ) consoleSend();
} );

consoleSwitchModeBinaryDiv.addEventListener( 'click', ( event ) => {
	consoleSetMode('binary');
} );

consoleSwitchModeTextDiv.addEventListener( 'click', ( event ) => {
	consoleSetMode('text');
} );

function consoleSetMode( mode ) {

	if ( ( consoleMode = mode ) === "text" ) {

		consoleSwitchModeBinaryDiv.classList.remove('active');
		consoleSwitchModeTextDiv.classList.add('active');

		consoleBinaryDiv.classList.remove('active');
		consoleTextDiv.classList.add('active');

	} else {

		consoleSwitchModeBinaryDiv.classList.add('active');
		consoleSwitchModeTextDiv.classList.remove('active');

		consoleBinaryDiv.classList.add('active');
		consoleTextDiv.classList.remove('active');

	}

}

function consolePush( bytes ) {

	bytes.forEach( ( byte ) => {

		let binaryByteSpan = document.createElement('span');
		let byteString = byte.toString( 16 );
		binaryByteSpan.textContent = ( ( byteString.length < 2 ? "0" : "" ) + byteString ).toUpperCase();
		consoleBinaryDiv.appendChild( binaryByteSpan );

		consoleTextContentDiv.textContent += String.fromCharCode( byte );

	} );

	if ( !consoleScrollLock ) consoleTextContentDiv.scrollTop = consoleTextContentDiv.scrollHeight;

}

function consoleSend() {

	let value = consoleTextInputInput.value + '\n'; // TODO: Add an option to add or not '\n'

	// Converting text to bytes
	let bytes = [];
	for ( let i = 0; i < value.length; i++ ) {
		bytes.push( value.charCodeAt( i ) );
	}

	// Resetting input
	consoleTextInputInput.value = "";

	// Send to main process
	ipcRenderer.send( 'console-send', bytes );

}

ipcRenderer.on( 'console-push', ( event, bytes ) => {
	consolePush( bytes );
} );

consoleSetMode('text');

// Register this renderer
ipcRenderer.send( 'register-renderer', 'console' );

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
