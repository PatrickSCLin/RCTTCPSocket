# TCP Socket in React-Native

Implement TCP socket module for React-Native

## Install

* Create a new react-native project. [Check react-native getting started](http://facebook.github.io/react-native/docs/getting-started.html#content)

* clone this project to root path of your project

* go to path of RCTTCPSocket
```
npm install
```

* Drag RCTTCPSocket.xcodeproj from ./RCTTCPSocket into your XCode project. Click on the project in XCode, go to Build Phases, then Link Binary With Libraries and add libRCTTCPSocket.a


## Usage

### JS

```js
var TCPSocket = require('./RCTTCPSocket/TCPSocket.ios');

var socket = new TCPSocket(url, port);

socket.onopen = function() {
  console.log('did open');
}

socket.ondata = function(data: Uint8Array) {
  console.log('data: ' + JSON.stringify(data));
}

socket.onerror = function(error) {
  console.log('did error: ' + error);
}

socket.onclose = function() {
  console.log('did close');
}
```
