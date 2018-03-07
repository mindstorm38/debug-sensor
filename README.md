# Debug sensor
Debug sensor is an electron application that use NodeJS (server-based javascript).

[![GitHub release](https://img.shields.io/github/release/mindstorm38/debug-sensor.svg)](https://github.com/mindstorm38/debug-sensor/releases)
[![Github All Releases](https://img.shields.io/github/downloads/mindstorm38/debug-sensor/total.svg)](https://github.com/mindstorm38/debug-sensor/releases)
[![GitHub Lastest Releases](https://img.shields.io/github/downloads/mindstorm38/debug-sensor/latest/total.svg)](https://github.com/mindstorm38/debug-sensor/releases)


## Intro
Debug sensor let you to communicate with a serial port and retrieve customisable packet and values.

## Table of content
* [Platform Support](#platform-support)
* [Installation](#installation)
* [Usage](#usage)
  * [Packet configuration](#packet-configuration)
  * [Connection](#connection)
  * [Real-time graph](#real-time-graph)
  * [Console](#console)
* [Issues](#issues)
* [Sensors codes examples](#sensors-codes-examples)
* [License](#license)

---------

### Platform Support
Debug sensor is currently only supported by Windows.
This limitation is only due to the `serialport` dependency, the help would be welcome from other contributors to help me to port this application on others platforms.

---------

### Installation
If you want to install this application there is two options :
- Clone or download this repository, and install yourselves all dependencies and launch it with `start.bat` windows script or `npm start` command.
- Download pre-packaged releases zip file for your platform, extract the zip in a folder named, for example "debug-sensor" and then run the executable file `debug-sensor.exe`.

> **Important note** : Linux and Mac platforms currently not supported (please refer to [Platform Support](#platform-support)).

---------

### Usage
The debug sensor's ergonomic interface makes it really easy to handle.

#### Packet configuration
The first thing to do is to configure the packet pattern, that's the way the data is stored in the packet sent over the serial port.

> Note : Pattern changes are automatically saved.

Packets are delimited by `sof` (start-of-frame), `eof` (end-of-frame) and an `escape` byte, the software only recognise packets with valid delimiters en escape.

> **Important note** :  Delimiters and escapes bytes are not currently configurable and their default values are : `sof` and `eof` is `0x7E` and `escape` is `0x7D`

A packet is composed of segments, each segment has :
* A type, it defines the size and the way the bytes will be read. List of current types :
  * (*Unsigned*) Byte
  * (*Unsigned*) Integer (16 bits)
  * (*Unsigned*) Integer (32 bits)
  * Floating Point Value (32 bits)
  * Floating Point Value (64 bits)
* An identifier to help you find it easily

To add a segment, just click on the `+` square, this will add a segment with a default type to `Unsigned Byte`.
Then a segment configuration panel open with multiple fields and buttons : the first text field is its identifier, the second drop-down menu is for selecting its type, "Remove" button to remove the segment and the last "x" button to close the segment configuration panel.

The number displayed at the bottom of the segment's square is the last value collected during the curernt session.

> Note : Currently, the segments are not movable.

#### Connection
To connect to your serial port, you must already have it installed on your computer, and then select it from the drop-down menu on the left side of the application. You can at the same time define the baud rate used by your port.
> Note : Be careful to configure the pattern of your packet before connecting, otherwise you will not receive data, which is normal behavior.

#### Real-time graph
The real-time graph is displayed in another window and can be accessed by clicking the "Show graph" button on the left side.

#### Console
A console is available at the bottom of the right side, it can be useful if you want to collect text data from your sensor, or to send text commands.

> Note : You must escape all bytes, even on bytes out of packets

---------

### Sensors codes examples
Read `examples` folder's [README](https://github.com/mindstorm38/debug-sensor/blob/master/examples/README.md) for more explanations.

> Not yet example

---------

### Issues
You can repport issues here : [Github Issues](https://github.com/mindstorm38/debug-sensor/issues)

---------

### License
Debug sensor is Apache-2.0 licensed
