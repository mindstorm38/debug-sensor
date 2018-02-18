/**
 * Main electron application js file
 */

// - Requires
const path = require('path');
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

// - Working directory
const workingDirectory = path.join( __dirname );

// - Main window
let mainWindow = null;

function createWindow() {

	mainWindow = new BrowserWindow( {
		width: 640,
		height: 360,
		title: "Debug Sensor",
		maximized: false,
		center: true
	} );

	mainWindow.loadURL( "file://" + path.join( workingDirectory, "html", "main.html" ) )

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
