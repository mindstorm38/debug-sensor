// Packet, PacketSegment, Type and DataOrder class
const packet = module.exports;

// Requires
const utils = require('./utils');

/**
 * Used to read and write in buffer, order of bytes
 */
class Order {}
packet.Order = Order;

Order.LITTLE_ENDIAN = 0;
Order.BIG_ENDIAN = 1;

/**
 * Represent a raw byte encoding
 */
class Type {

	/**
	 *  @param {string}   identifier	Type identifier, used for saving
	 *  @param {string}   name			Visual name of the type
	 *  @param {integer}  size			Size int byte(s)
	 *  @param {function} callback		Function fn( buffer, index, dataOrder ) and return read value @see {Type#read}
	 */
	constructor( identifier, name, size, callback ) {

		if ( size < 1 ) throw new Error("Invalid 'size' argument, can't be less than 1 byte");

		this.identifier = identifier;
		this.name = name;
		this.size = size;
		this.callback = callback;

	}

	/**
	 * Read buffer as defined by this type
	 *
	 * @param  {Buffer}  buffer		Buffer to read in
	 * @param  {integer} index		Index (cursor) where read
	 * @param  {integer} dataOrder	Endian format used as integer id @see {Order}
	 * @return {integer}			Read value from buffer
	 */
	read( buffer, index, dataOrder ) {
		return this.callback( buffer, index, dataOrder );
	}

}
packet.Type = Type;

Type.U_INT_8 = new Type( "uint8", "Unsigned Byte", 1, ( buffer, index ) => buffer.readUInt8( index ) );
Type.INT_8 = new Type( "int8", "Byte", 1, ( buffer, index ) => buffer.readInt8( index ) );
Type.U_INT_16 = new Type( "uint16", "Unsigned Integer (16)", 2, ( buffer, index, dataOrder ) => dataOrder === Order.LITTLE_ENDIAN ? buffer.readUInt16LE( index ) : buffer.readUInt16BE( index ) );
Type.INT_16 = new Type( "int16", "Integer (16)", 2, ( buffer, index, dataOrder ) => dataOrder === Order.LITTLE_ENDIAN ? buffer.readInt16LE( index ) : buffer.readInt16BE( index ) );
Type.U_INT_32 = new Type( "uint32", "Unsigned Integer (32)", 4, ( buffer, index, dataOrder ) => dataOrder === Order.LITTLE_ENDIAN ? buffer.readUInt32LE( index ) : buffer.readUInt32BE( index ) );
Type.INT_32 = new Type( "int32", "Integer (32)", 4, ( buffer, index, dataOrder ) => dataOrder === Order.LITTLE_ENDIAN ? buffer.readInt32LE( index ) : buffer.readInt32BE( index ) );
Type.FLOAT_32 = new Type( "float32", "Floating Point Value (32)", 4, ( buffer, index, dataOrder ) => dataOrder === Order.LITTLE_ENDIAN ? buffer.readFloatLE( index ) : buffer.readFloatBE( index )  );
Type.FLOAT_32 = new Type( "float64", "Floating Point Value (64)", 8, ( buffer, index, dataOrder ) => dataOrder === Order.LITTLE_ENDIAN ? buffer.readDoubleLE( index ) : buffer.readDoubleBE( index )  );

/**
 *
 * Get type from its identifier
 *
 * @param  {string} identifier	Type identifier
 * @return {Type}				Type thats had this identifier
 */
Type.fromIdentifier = ( identifier ) => {
	for ( let idx in Type ) {
		let obj = Type[ idx ];
		if ( obj instanceof Type && obj.identifier === identifier ) {
			return obj;
		}
	}
	return null;
};

/**
 * A list of segment, with start/end of frame and escape character
 */
class Packet {

	/**
	 * @param {string} identifier	Identifier of the packet
	 */
	constructor( identifier ) {

		this.uid = Packet.uid++;
		this.identifier = identifier;
		this.segments = [];
		this.sof = 0x7E;
		this.eof = 0x7E;
		this.escape = 0x7D;

	}

	/**
	 * Get packet segment from its uid
	 *
	 * @param  {int} uid		Packet segment uid
	 * @return {PacketSegment}	PacketSegment corresponding to the uid, or null if no segment with this uid
	 */
	getSegment( uid ) {
		for ( let i in this.segments ) {
			if ( this.segments[ i ].uid === uid ) {
				return this.segments[ i ];
			}
		}
		return null;
	}

	/**
	 * Add a new segment in the packet
	 *
	 * @param {string} identifier	Packet segment identifier
	 * @param {Type}   type			Packet segment type
	 */
	newSegment( identifier, type ) {

		let segment = new PacketSegment( identifier, type );
		this.segments.push( segment );
		return segment;

	}


	/**
	 * Remove a segment in the packet
	 *
	 * @param  {PacketSegment} segment Segement to remove
	 */
	removeSegment( segment ) {

		let removed = utils.removeFromArray( this.segments, segment );

	}

}
packet.Packet = Packet;
Packet.uid = 0;

/**
 * Packet segment defined by a type @see {Type}
 */
class PacketSegment {

	/**
	 * @param {string} identifier	Identifier of the segment
	 * @param {Type}   type			Type of the segment
	 */
	constructor( identifier, type ) {

		this.uid = PacketSegment.uid++;
		this.identifier = identifier;
		this.type = type || Type.U_INT_8;

	}

	getDefaultName() {
		return `Segment #${this.uid}`;
	}

	getName() {
		return this.identifier || this.getDefaultName();
	}

	getSize() {
		return this.type.size;
	}

}
packet.PacketSegment = PacketSegment;
PacketSegment.uid = 0;
