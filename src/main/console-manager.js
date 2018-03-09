
const utils = require('../utils');
const main = require('./main');
const path = require('path');
const { ipcMain, BrowserWindow } = require('electron');
const rendererConnector = require('./renderer-connector');

let rendererMain = null;
let rendererConsole = null;

module.exports.init = () => {



};

let win = module.exports.win = {
	window: null,
	visible: false
};

win.init = () => {

	win.window = new BrowserWindow( {
		width: 900,
		height: 600,
		title: `Console`,
		maximized: true,
		center: true,
		show: false,
		parent: main.win
	} );

	win.window.loadURL( 'file://' + path.join( __dirname, '../../res/console.html' ) );

	win.window.setMenu( null );

	win.window.on( 'minimize', () => {
		win.hide();
	} );

};

win.show = () => {
	win.window.show();
	win.setVisible( true );
};

win.hide = () => {
	win.window.hide();
	win.setVisible( false );
};

win.toggleVisible = () => {
	if ( win.visible ) win.hide();
	else win.show();
};

win.setVisible = ( visible ) => {
	setConsoleWindowVisible( win.visible = visible );
};

rendererConnector.registerRendererInit( 'main', ( ipc ) => {

	rendererMain = ipc;

	setConsoleWindowVisible( false );

} );

rendererConnector.registerRendererInit( 'console', ( ipc ) => {

	rendererConsole = ipc;

} );

function setConsoleWindowVisible( visible ) {
	if ( rendererMain === null ) return;
	rendererMain.send( 'reader-console-visible', visible );
}

ipcMain.on( 'reader-console-visible-toggle', ( event ) => {
	win.toggleVisible();
} );

ipcMain.on( 'renderer-console-request-close', ( event ) => {

	if ( win.window.isDestroyed() ) return;
	win.hide();

} );
