const { app, BrowserWindow, ipcMain } = require('electron');
const url = require('url');
const path = require('path');
const utils = require('../utils');

global.debugsensor = {
	appdata: path.join( utils.getAppdataDir(), '.debugsensor' )
};

function start() {

	require('./renderer-connector');
	require('./serial-manager').init();
	require('./packet-manager').init();

	createWindow();

}

let win = null;

function createWindow() {

	win = new BrowserWindow( {
		width: 900,
		height: 600,
		title: `Debug Sensor`,
		maximized: true,
		center: true,
		show: false
	} );

	win.loadURL( 'file://' + path.join( __dirname, '../../res/main.html' ) );

	win.once( 'ready-to-show', () => {
		win.show();
	} );

	win.setMenu( null );

	win.on( 'closed', () => {
		mainWindow = null;
	} );

	// win.webContents.openDevTools();

}

app.on( 'ready', () => {
	start();
} );

app.on( 'window-all-closed', () => {
	if ( process.platform !== 'darwin' ) {
		app.quit();
	}
} );

app.on( 'activate', () => {
	if ( mainWindow === null ) {
		createWindow();
	}
} );
