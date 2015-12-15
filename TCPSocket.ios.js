'use strict';

var React = require('react-native');
var { NativeAppEventEmitter, NativeModules } = React;
var RCTTCPSocketManager = NativeModules.TCPSocketManager;

var TCPSocketBase = require('./TCPSocketBase.ios');
var Base64 = require('base64-js');

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

  sendStringImpl(data: string): void {
    RCTTCPSocketManager.send(data, this._socketId, false);
  }

  sendByteArrayImpl(data: Uint8Array): void {
    RCTTCPSocketManager.send(Base64.fromByteArray(data), this._socketId, true);
  }

  _unregisterEvents(): void {
    this._subs.forEach(e => e.remove());
    this._subs = [];
  }

  _registerEvents(id: number): void {
    this._subs = [
      NativeAppEventEmitter.addListener(
        'TCPSocketMessage',
        function(ev) {
          if (ev.id !== id) {
            return;
          }
          if (this.ondata) {
            var buf = typeof Buffer === 'undefined'
              ? Base64.toByteArray(ev.data)
              : new Buffer(ev.data, 'base64');
            this.ondata({
                data: buf
              });
          }
        }.bind(this)
      ),
      NativeAppEventEmitter.addListener(
        'TCPSocketOpen',
        function(ev) {
          if (ev.id !== id) {
            return;
          }
          this.readyState = this.OPEN;
          this.onopen && this.onopen();
        }.bind(this)
      ),
      NativeAppEventEmitter.addListener(
        'TCPSocketClosed',
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
      NativeAppEventEmitter.addListener(
        'TCPSocketFailed',
        function(ev) {
          if (ev.id !== id) {
            return;
          }
          this.onerror && this.onerror(new Error(ev.data));
          this._unregisterEvents();
          RCTTCPSocketManager.close(id);
        }.bind(this)
      )
    ];
  }

}

module.exports = TCPSocket;
