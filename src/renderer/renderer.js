/**
 * Main electron renderer js file
 */

const serial = require('./serial');
const packet = require('./packet');

module.exports = {
	serial: serial,
	packet: packet
};
