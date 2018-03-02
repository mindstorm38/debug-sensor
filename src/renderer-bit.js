
const { ipcRenderer, remote } = require('electron');
const utils = require('./utils');

// Register this renderer
ipcRenderer.send( 'register-renderer', 'bit' );

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
