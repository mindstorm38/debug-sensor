
const { ipcMain } = require('electron');

const renderers = {};

ipcMain.on( 'register-renderer', ( event, name ) => {

	if ( renderers[ name ] === undefined ) return;

	renderers[ name ].ipc = event.sender;

	renderers[ name ].inits.forEach( init => {
		
		init( event.sender );

	} );

} );

module.exports.getRendererIpc = ( name ) => {
	if ( renderers[ name ] === undefined ) return null;
	return renderers[ name ].ipc;
};

module.exports.registerRendererInit = ( name, init ) => {

	if ( typeof init !== 'function' ) throw new TypeError("Invalid 'init' parameter, must be a valid function");

	if ( renderers[ name ] === undefined ) {

		renderers[ name ] = {
			inits: [],
			ipc: null
		};

	}

	renderers[ name ].inits.push( init );

};
