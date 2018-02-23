// Serial
const serial = module.exports;

// Baudrates
const BAUDRATES = [ 110, 300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 28800, 38400, 56000, 57600, 115200 ];
const INITIAL_BAUDRATE = 115200;

serial.BAUDRATES = BAUDRATES;
serial.INITIAL_BAUDRATE = INITIAL_BAUDRATE;