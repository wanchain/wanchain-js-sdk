"use strict";

const WebSocket = require('ws');
const messageFactory = require('../webSocket/messageFactory');

const OPTIONS = {
  'handshakeTimeout': 12000,
  rejectUnauthorized: false
};
/**
 * @class
 * @classdesc  Common web socket used communication with external modules.
 */
class SendByWebSocket {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.lockReconnect = false;
    this.functionDict = {};
    this.heartCheck();
    this.createWebSocket();
  }

  createWebSocket() {
    try {
      this.webSocket = new WebSocket(this.wsUrl, OPTIONS);
      this.initEventHandle();
    } catch (e) {
      this.reconnect();
    }
  }

  initEventHandle() {
      this.webSocket.onmessage = (message) => {
          this.heartCheck.start();
          let value = JSON.parse(message.data);
          this.getMessage(value);
      };

      this.webSocket.onopen = () => {
          this.heartCheck.start();
      };

      this.webSocket.on('pong', () => {
          this.heartCheck.start();
      });

      this.webSocket.onclose = () => {
          this.reconnect();
      };

      this.webSocket.onerror = () => {
          this.reconnect();
      };
  }

  heartCheck() {
    let that = this;
    this.heartCheck = {
      timeout: 20000,
      timeoutObj: null,
      serverTimeoutObj: null,
      reset() {
        clearTimeout(this.timeoutObj);
        clearTimeout(this.serverTimeoutObj);
      },
      start() {
          let self = this;
          this.reset();
          this.timeoutObj = setTimeout(function () {
              if(that.webSocket.readyState === WebSocket.OPEN) {
                that.webSocket.ping('{"event": "ping"}');
              }
              self.serverTimeoutObj = setTimeout(function () {
                  that.webSocket.close();
              }, self.timeout);
          }, self.timeout);
      }
    };
  }

  reconnect() {
    if (this.lockReconnect) {
      return;
    }
    this.lockReconnect = true;
    this.reTt && clearTimeout(this.reTt);
    this.reTt = setTimeout(() => {
      this.createWebSocket();
      this.lockReconnect = false;
    }, 2000);
  }

  close() {
    this.webSocket.close();
  }

  send(data) {
    if (this.webSocket.readyState === WebSocket.OPEN) {
      this.webSocket.send(data);
    } else {
      this.reconnect();
      setTimeout(() => {
        this.send(data);
      }, 2000);
    }
  }

  getMessage(message) {
    this.functionDict[message.header.index].onMessage(message);
    delete this.functionDict[message.header.index];
  }

  sendMessage(...args) {
    let message = this.createMessage(...args);
    this.functionDict[message.message.header.index] = message;
    //logDebug.debug(`sendMessage: `,message.message);
    this.webSocket.send(JSON.stringify(message.message));

  }

  createMessage(...args) {

    let [firstArg, ...rest] = args;
    return messageFactory[firstArg](...rest);
  }

  hasMessage(methodName){
    return messageFactory[methodName];
  }
}

module.exports = SendByWebSocket;