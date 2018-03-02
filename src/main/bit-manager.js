
const utils = require('../utils');
const main = require('./main');
const path = require('path');
const { ipcMain, BrowserWindow } = require('electron');
const rendererConnector = require('./renderer-connector');

let win = null;
let bits = [];

module.exports.init = () => {



};

module.exports.win = {
	init: () => {

		win = new BrowserWindow( {
			width: 500,
			height: 400,
			title: `Bit reader`,
			maximized: true,
			center: true,
			show: false,
			parent: main.win
		} );

		win.loadURL( 'file://' + path.join( __dirname, '../../res/bit.html' ) );

		win.setMenu( null );

		win.on( 'closed', ( event ) => {

			if ( win.isDestroyed() ) return;

			event.preventDefault();
			win.hide();

		} )

	},
	show: () => {

		win.show();

	},
	hide: () => {

		win.hide();

	}
};

rendererConnector.registerRendererInit( 'bit', ( ipc ) => {



} );

class Bit {

	constructor( identifier, segment, bit ) {

		this.uid = Bit.uid++;
		this.identifier = identifier;
		this.segment = segment;
		this.setBit( bit );

	}

	setBit( bit ) {
		if ( typeof bit !== "number" ) throw new Error("Parameter 'bit' should be a number");
		if ( bit % 1 !== 0 ) throw new Error("Parameter 'bit' should be a valid integer");
		if ( bit < 0 || bit >= this.segment.getSize() ) throw new RangeError("Invalid bit index");
		this.bit = bit;
	}

	getDefaultName() {
		return this.segment.getName() + " #" + this.bit;
	}

	getName() {
		return this.identifier || this.getDefaultName();
	}

	getValue() {

	}

}
Bit.uid = 0;
