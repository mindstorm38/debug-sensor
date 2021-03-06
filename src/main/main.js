const { app, BrowserWindow, ipcMain } = require('electron');
const url = require('url');
const path = require('path');
const fs = require('fs');
const utils = require('../utils');

// Tmp save segments values
const csv = require('csv');
const csvStringify = require('csv-stringify');
// --- \\

global.debugsensor = {
	appdata: path.join( utils.getAppdataDir(), '.debugsensor' )
};

if ( !fs.existsSync( global.debugsensor.appdata ) ) {
	fs.mkdirSync( global.debugsensor.appdata );
}

function start() {

	let bitManager = require('./bit-manager');
	let graphManager = require('./graph-manager');
	let consoleManager = require('./console-manager');

	require('./renderer-connector');
	require('./serial-manager').init();
	require('./packet-manager').init();
	bitManager.init();
	graphManager.init();
	consoleManager.init();

	require('./config-manager').load();

	createWindow();

	bitManager.win.init();
	graphManager.win.init();
	consoleManager.win.init();

}

function stop() {

	require('./config-manager').save();

	// Tmps save segments values
	const packetManager = require('./packet-manager');

	let columns = [];
	let rawValues = [];
	let minLength = null;

	packetManager.getCurrentPacket().segments.forEach( ( segment ) => {

		let segmentValues = segment.values;

		columns.push( segment.getName() );
		rawValues.push( segmentValues );

		if ( minLength === null || minLength > segmentValues.length ) {
			minLength = segmentValues.length;
		}

	} );

	if ( minLength !== null ) {

		let values = [];

		for ( let i = 0; i < minLength; i++ ) {

			let line = [];

			for ( let j in rawValues ) {

				line.push( rawValues[ j ][ i ] );

			}

			values.push( line );

		}

		csvStringify( values, {
			columns: columns,
			header: true
		}, ( err, output ) => {

			fs.open( path.join( global.debugsensor.appdata, "values.csv" ), 'w', 0o666, ( err, fd ) => {

				if ( err ) {

					console.log( err );
					return;

				}

				fs.write( fd, output, ( err, written, string ) => {

					if ( err ) {

						console.log( err );
						return;

					}

					console.log( "CSV values file successfuly saved" );

				} );

			} );

		} );

	}

	// ---- \\

}

let win = null;

function createWindow() {

	win = new BrowserWindow( {
		width: 1100,
		height: 700,
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
		module.exports.win = win;

	} );

	module.exports.win = win;

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

app.on( 'quit', () => {
	stop();
} );

app.on( 'activate', () => {
	if ( mainWindow === null ) {
		createWindow();
	}
} );

module.exports.win = win;
