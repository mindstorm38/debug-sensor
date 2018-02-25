// Start script

// Requires
const path = require('path');
const fs = require('fs');
const utils = require('../common/utils');
const paths = require('./paths');

paths.base = path.join( __dirname, '..' );
paths.renderer = path.join( paths.base, 'renderer' );
paths.appdata = path.join( utils.getAppdataDir(), '.debugsensor' );

if ( !fs.existsSync( paths.appdata ) ) fs.mkdirSync( paths.appdata );

require('./main');
