/**
 * Utils
 */

const $ = require('jquery');
const path = require('path');

function getBoxPositions( element ) {

	let jQueryWindow = $( window );
	let boundingClientRect = element.getBoundingClientRect();

	return {
		"top_left": {
			"x": boundingClientRect.left + jQueryWindow.scrollLeft(),
			"y": boundingClientRect.top + jQueryWindow.scrollTop()
		},
		"top_right": {
			"x": boundingClientRect.left + boundingClientRect.width + jQueryWindow.scrollLeft(),
			"y": boundingClientRect.top + jQueryWindow.scrollTop()
		},
		"bottom_left": {
			"x": boundingClientRect.left + jQueryWindow.scrollLeft(),
			"y": boundingClientRect.top + boundingClientRect.height + jQueryWindow.scrollTop()
		},
		"bottom_right": {
			"x": boundingClientRect.left + boundingClientRect.width + jQueryWindow.scrollLeft(),
			"y": boundingClientRect.top + boundingClientRect.height + jQueryWindow.scrollTop()
		}
	};

}

function getCurrentMillis() {
	return new Date().getTime();
}

function arrayDif( baseArray, compareArray, equalFunction, addFunction, removeFunction ) {

	baseArray.forEach( baseElement => {

		let remove = true;

		compareArray.forEach( compareElement => {

			if ( !remove ) return;
			if ( equalFunction( baseElement, compareElement ) ) remove = false;

		} );

		if ( remove ) {

			removeFunction( baseElement );

		}

	} );

	compareArray.forEach( compareElement => {

		let add = true;

		baseArray.forEach( baseElement => {

			if ( !add ) return;
			if ( equalFunction( compareElement, baseElement ) ) add = false;

		} );

		if ( add ) {

			addFunction( compareElement );

		}

	} );

}

function removeFromArray( array, elt ) {
	let idx = array.indexOf( elt );
	if ( idx === -1 ) array;
	array.splice( idx, 1 );
}

function getAppDataDir() {
	let appdata = process.env.APPDATA || ( process.platform == 'darwin' ? process.env.HOME + 'Library/Preferences' : '/var/local' );
	return path.join( appdata, ".debugsensor" );
}

module.exports = {
	getBoxPositions: getBoxPositions,
	getCurrentMillis: getCurrentMillis,
	arrayDif: arrayDif,
	removeFromArray: removeFromArray,
	getAppDataDir: getAppDataDir
};
