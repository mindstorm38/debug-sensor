
const utils = require('../utils');
const main = require('./main');
const path = require('path');
const { ipcMain, BrowserWindow } = require('electron');
const rendererConnector = require('./renderer-connector');

let rendererMain = null;
let rendererGraph = null;

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
		title: `Graph`,
		maximized: true,
		center: true,
		show: false,
		parent: main.win
	} );

	win.window.loadURL( 'file://' + path.join( __dirname, '../../res/graph.html' ) );

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
	setGraphWindowVisible( win.visible = visible );
};

rendererConnector.registerRendererInit( 'main', ( ipc ) => {

	rendererMain = ipc;

	setGraphWindowVisible( false );

} );

rendererConnector.registerRendererInit( 'graph', ( ipc ) => {

	rendererGraph = ipc;

} );

function setGraphWindowVisible( visible ) {
	if ( rendererMain === null ) return;
	rendererMain.send( 'reader-graph-visible', visible );
}

ipcMain.on( 'reader-graph-visible-toggle', ( event ) => {
	win.toggleVisible();
} );

ipcMain.on( 'renderer-graph-request-close', ( event ) => {

	if ( win.window.isDestroyed() ) return;
	win.hide();

} );
