// Main electron application js file
const main = module.exports;

// Requires
const paths = require('./paths');
const path = require('path');
const fs = require('fs');
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;
const utils = require('../common/utils');
const system = require('./system');

// Start
function start() {

	createWindow();

	system.init();

}

// Main window
let mainWindow = null;

function createWindow() {

	mainWindow = new BrowserWindow( {
		width: 1280,
		height: 720,
		title: "Debug Sensor",
		maximized: true,
		center: true
	} );

	mainWindow.loadURL( "file://" + path.join( paths.renderer, 'main.html') );

	mainWindow.setMenu( null );

	mainWindow.on( 'closed', () => {

		mainWindow = null;

	} );

}

function switchWindowFullscreen() {
	if ( mainWindow != null ) {
		mainWindow.setFullscreen( !mainWindow.isFullscreen );
	}
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
