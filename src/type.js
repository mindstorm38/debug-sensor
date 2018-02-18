/**
 * Data part type
 */

const $ = require('jquery');

class Type {

	constructor( size, callback, identifier, name ) {

		if ( size < 1 ) throw new Error("Type size can't be less than 1 byte");

		// Number of bytes
		this.size = size;

		// Callback to get value from buffer
		this.callback = callback;

		// Identifier
		this.identifier = identifier;

		// Visual name
		this.name = name;

	}

	callback() {
		return this.callback;
	}

}

const LITTLE_ENDIAN		= 0;
const BIG_ENDIAN		= 1;

const UNSIGNED_INT_8 = new Type( 1, ( buf, index ) => {
	return buf.readUInt8( index );
}, "uint8", "Unsigned Byte" );
const INT_8 = new Type( 1, ( buf, index ) => {
	return buf.readInt8( index );
}, "int8", "Byte" );

const UNSIGNED_INT_16 = new Type( 2, ( buf, index, endianFormat ) => {
	return endianFormat === LITTLE_ENDIAN ? buf.readUInt16LE( index ) : buf.readUInt16BE( index );
}, "uint16", "Unsigned Integer (16)" );
const INT_16 = new Type( 2, ( buf, index, endianFormat ) => {
	return endianFormat === LITTLE_ENDIAN ? buf.readInt16LE( index ) : buf.readInt16BE( index );
}, "int16", "Integer (16)" );

const UNSIGNED_INT_32 = new Type( 4, ( buf, index, endianFormat ) => {
	return endianFormat === LITTLE_ENDIAN ? buf.readUInt32LE( index ) : buf.readUInt32BE( index );
}, "uint32", "Unsigned Integer (32)" );
const INT_32 = new Type( 4, ( buf, index, endianFormat ) => {
	return endianFormat === LITTLE_ENDIAN ? buf.readInt32LE( index ) : buf.readInt32BE( index );
}, "int32", "Integer (32)" );

const FLOAT_32 = new Type( 4, ( buf, index, endianFormat ) => {
	return endianFormat === LITTLE_ENDIAN ? buf.readFloatLE( index ) : buf.readFloatBE( index );
}, "float32", "Floating Point Number (32)" );
const FLOAT_64 = new Type( 8, ( buf, index, endianFormat ) => {
	return endianFormat === LITTLE_ENDIAN ? buf.readDoubleLE( index ) : buf.readDoubleBE( index );
}, "float64", "Floating Point Number (64)" );

Type.Order = {};
Type.Order.LITTLE_ENDIAN = LITTLE_ENDIAN;
Type.Order.BIG_ENDIAN = BIG_ENDIAN;

Type.Enum = {};
Type.Enum.UNSIGNED_INT_8 = UNSIGNED_INT_8;
Type.Enum.INT_8 = INT_8;
Type.Enum.UNSIGNED_INT_16 = UNSIGNED_INT_16;
Type.Enum.INT_16 = INT_16;
Type.Enum.UNSIGNED_INT_32 = UNSIGNED_INT_32;
Type.Enum.INT_32 = INT_32;
Type.Enum.FLOAT_32 = FLOAT_32;
Type.Enum.FLOAT_64 = FLOAT_64;

Type.Enum.fromIdentifier = function( identifier ) {
	let ret = null;
	$.each( Type.Enum, ( idx, type ) => {
		if ( !( type instanceof Type ) ) return;
		if ( type.identifier === identifier ) ret = type;
	} );
	return ret;
};

module.exports = {
	Type: Type
};
