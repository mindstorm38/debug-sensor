/**
 * Utils
 */

 const $ = require('jquery');

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

module.exports = {
	getBoxPositions: getBoxPositions,
	getCurrentMillis: getCurrentMillis
};
