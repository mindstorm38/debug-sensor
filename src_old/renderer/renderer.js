// Main renderer script

// Requires
const electron = require('electron');
const remote = electron.remote;
const ipc = electron.ipcRenderer;

// Reload (F5) and dev tools (F12)
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

// Register this renderer process in system
ipc.send( 'register-renderer-process', 'main' );

require('./packet');
require('./serial');
