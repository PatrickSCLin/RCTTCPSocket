'use strict';

var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
var RCTTCPSocketManager = require('NativeModules').TCPSocketManager;

var TCPSocketBase = require('./TCPSocketBase.ios');

var TCPSocketId = 0;

class TCPSocket extends TCPSocketBase {
  _socketId: number;
  _subs: any;

  connectToSocketImpl(host: string, port: number): void {
    this._socketId = TCPSocketId++;
    RCTTCPSocketManager.connect(host, port, this._socketId);
    this._registerEvents(this._socketId);
  }

  closeConnectionImpl(): void {
    RCTTCPSocketManager.close(this._socketId);
  }

  cancelConnectionImpl(): void {
    RCTTCPSocketManager.close(this._socketId);
  }

  sendStringImpl(message: string): void {
    RCTTCPSocketManager.send(message, this._socketId);
  }

  sendArrayBufferImpl(): void {
    // TODO
    console.warn('Sending ArrayBuffers is not yet supported');
  }

  _unregisterEvents(): void {
    this._subs.forEach(e => e.remove());
    this._subs = [];
  }

  _registerEvents(id: number): void {
    this._subs = [
      RCTDeviceEventEmitter.addListener(
        'TCPsocketMessage',
        function(ev) {
          if (ev.id !== id) {
            return;
          }
          this.onmessage && this.onmessage({
            data: ev.data
          });
        }.bind(this)
      ),
      RCTDeviceEventEmitter.addListener(
        'TCPsocketOpen',
        function(ev) {
          if (ev.id !== id) {
            return;
          }
          this.readyState = this.OPEN;
          this.onopen && this.onopen();
        }.bind(this)
      ),
      RCTDeviceEventEmitter.addListener(
        'TCPsocketClosed',
        function(ev) {
          if (ev.id !== id) {
            return;
          }
          this.readyState = this.CLOSED;
          this.onclose && this.onclose(ev);
          this._unregisterEvents();
          RCTTCPSocketManager.close(id);
        }.bind(this)
      ),
      RCTDeviceEventEmitter.addListener(
        'TCPsocketFailed',
        function(ev) {
          if (ev.id !== id) {
            return;
          }
          this.onerror && this.onerror(new Error(ev.message));
          this._unregisterEvents();
          RCTTCPSocketManager.close(id);
        }.bind(this)
      )
    ];
  }

}

module.exports = TCPSocket;