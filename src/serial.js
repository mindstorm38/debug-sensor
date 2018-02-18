/**
 * Renderer serial manager
 */

const serialport = require('serialport');

let availablesSerialPorts = [];

function updateAvailablesSerialPorts() {

	serialport.list( ( err, ports ) => {

		if ( err ) {

			console.error( err.message );
			return;

		}

		let select = document.querySelector('select#ds-serial-port');
		let button = document.querySelector('button#ds-serial-connect');

		if ( ports.length > 0 ) {

			if ( availablesSerialPorts.length === 0 ) select.innerHTML = "";

			let children = select.childNodes;

			select.classList.remove('ds-disabled');
			button.classList.remove('ds-disabled');

			availablesSerialPorts.forEach( port => {

				let remove = true;

				ports.forEach( _port => {
					if ( !remove ) return;
					if ( port.comName === _port.comName ) remove = false;
				} );

				if ( remove ) {

					children.forEach( child => {

						if ( child.getAttribute("value") === port ) child.remove();

					} );

				}

			} );

			ports.forEach( port => {

				let add = true;

				availablesSerialPorts.forEach( _port => {
					if ( !add ) return;
					if ( port.comName === _port.comName ) add = false;
				} );

				if ( add ) {

					let elt = document.createElement("option");
					elt.setAttribute( 'value', port.comName );
					elt.textContent = port.comName;

					select.appendChild( elt );

				}

			} );

		} else {

			select.classList.add('ds-disabled');
			button.classList.add('ds-disabled');
			select.innerHTML = "";

			let elt = document.createElement("option");
			elt.textContent = "No serial port";

			select.appendChild( elt );

		}

		availablesSerialPorts = ports;

	} );

}

updateAvailablesSerialPorts();
setInterval( updateAvailablesSerialPorts, 5000 );

module.exports = {
	updateAvailablesSerialPorts: updateAvailablesSerialPorts,
	availablesSerialPorts: availablesSerialPorts
};
