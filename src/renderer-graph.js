
const { ipcRenderer, remote } = require('electron');
const utils = require('./utils');

const MAX_POINTS = 1500;

const graphDiv = document.querySelector('div#graph');

let data = [];
let tracesIndexes = {};

Plotly.plot( graphDiv, data, {
	showlegend: true,
	xaxis: {
		title: 'Timeline',
		type: 'date'
	},
	yaxis: {
		title: 'Value'
	}
} );

window.addEventListener( 'resize', () => {

	Plotly.Plots.resize( graphDiv );

} );

window.addEventListener( 'beforeunload', ( event ) => {

	event.returnValue = false;
	ipcRenderer.send( 'renderer-graph-request-close' );

} );

function getTraceIndex( uid ) {
	for ( let i in data ) {
		if ( data[ i ]._custom.uid === uid ) return parseInt( i );
	}
	return null;
}

ipcRenderer.on( 'graph-trace-add', ( event, uid, name ) => {

	Plotly.addTraces( graphDiv, {
		x: [],
		y: [],
		mode: 'lines',
		name: name,
		_custom: {
			uid: uid
		}
	} );

	tracesIndexes[ uid ] = getTraceIndex( uid );

} );

ipcRenderer.on( 'graph-trace-remove', ( event, uid ) => {

	let traceIndex = tracesIndexes[ uid ];
	if ( traceIndex === undefined ) return;

	Plotly.deleteTraces( graphDiv, traceIndex );
	delete tracesIndexes[ uid ];

} );

ipcRenderer.on( 'graph-trace-name', ( event, uid, name ) => {

	let traceIndex = tracesIndexes[ uid ];
	if ( traceIndex === undefined ) return;

	/*
	let dataUpdate = [];

	dataUpdate[ traceIndex ].name = name;

	Plotly.update( graphDiv, dataUpdate, {} );
	*/

	data[ traceIndex ].name = name;

} );

ipcRenderer.on( 'graph-value-add', ( event, values, date ) => {

	date = new Date( date );

	let datasList = {
		x: [],
		y: []
	};
	let tracesList = [];

	for ( let i in values ) {

		let traceIndex = tracesIndexes[ i ];
		if ( traceIndex === undefined ) continue;

		tracesList.push( traceIndex );

		datasList.x.push( [ date ] );
		datasList.y.push( [ values[ i ] ] );

	}

	let older = date.setMinutes( date.getMinutes() - 1 );
	let future = date.setMinutes( date.getMinutes() + 1 );

	// Test deleting if to much points
	data.forEach( ( trace ) => {

		let length = trace.x.length;
		let nb = length - MAX_POINTS;

		if ( nb <= 0 ) return;

		trace.x.splice( 0, nb );
		trace.y.splice( 0, nb );

	} );

	Plotly.relayout( graphDiv, {
		xaxis: {
			type: 'date',
			range: [ older, future ]
		}
	} )
	Plotly.extendTraces( graphDiv, datasList, tracesList );

} );

// Register this renderer
ipcRenderer.send( 'register-renderer', 'graph' );

// Reload ( F5 °116 ) and dev tools ( F12 °123 )
document.addEventListener( 'keydown', ( e ) => {

	switch ( e.which ) {
		case 123:
			remote.getCurrentWindow().toggleDevTools();
			break;
		case 116:
			location.reload();
			break;
	}

} );
