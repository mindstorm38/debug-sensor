/**
 * Main electron application js file
 */

// - Requires
const path = require('path');
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;

// - Working directory
const workingDirectory = path.join( __dirname );
const rendererDirectory = path.join( workingDirectory, "renderer" );

// - Main window
let mainWindow = null;

function createWindow() {

	mainWindow = new BrowserWindow( {
		width: 1280,
		height: 720,
		title: "Debug Sensor",
		maximized: true,
		center: true
	} );

	mainWindow.loadURL( "file://" + path.join( rendererDirectory, "main.html" ) )

	mainWindow.on( 'closed', () => {

		mainWindow = null;

	} )

}

function switchWindowFullscreen() {
	if ( mainWindow != null ) {
		mainWindow.setFullscreen( !mainWindow.isFullscreen );
	}
}

app.on( 'ready', () => {

	createWindow();

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

module.exports = {
	working_dir: workingDirectory,
	main_window: mainWindow
};
