'use strict';

class TCPSocketBase {
  CONNECTING: number;
  OPEN: number;
  CLOSING: number;
  CLOSED: number;

  onclose: ?Function;
  onerror: ?Function;
  onmessage: ?Function;
  onopen: ?Function;

  binaryType: ?string;
  bufferedAmount: number;
  extension: ?string;
  protocol: ?string;
  readyState: number;
  host: ?string;
  port: ?number;

  constructor(host: string, port: number, protocols: ?any) {
    this.CONNECTING = 0;
    this.OPEN = 1;
    this.CLOSING = 2;
    this.CLOSED = 3;

    if (!protocols) {
      protocols = [];
    }

    this.connectToSocketImpl(host, port);
  }

  close(): void {
    if (this.readyState === TCPSocketBase.CLOSING ||
        this.readyState === TCPSocketBase.CLOSED) {
      return;
    }

    if (this.readyState === TCPSocketBase.CONNECTING) {
      this.cancelConnectionImpl();
    }

    this.closeConnectionImpl();
  }

  send(data: any): void {
    if (this.readyState === TCPSocketBase.CONNECTING) {
      throw new Error('INVALID_STATE_ERR');
    }
    if (typeof data === 'string') {
      this.sendStringImpl(data);
    } else if (data instanceof Uint8Array) {
      this.sendByteArrayImpl(data);
    } else {
      throw new Error('Not supported data type');
    }
  }

  closeConnectionImpl(): void {
    throw new Error('Subclass must define closeConnectionImpl method');
  }

  connectToSocketImpl(): void {
    throw new Error('Subclass must define connectToSocketImpl method');
  }

  cancelConnectionImpl(): void {
    throw new Error('Subclass must define cancelConnectionImpl method');
  }

  sendStringImpl(): void {
    throw new Error('Subclass must define sendStringImpl method');
  }

  sendByteArrayImpl(): void {
    throw new Error('Subclass must define sendArrayBufferImpl method');
  }

}

module.exports = TCPSocketBase;
