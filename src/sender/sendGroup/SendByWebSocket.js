"use strict";

const WebSocket = require('ws');
const messageFactory = require('../webSocket/messageFactory');

const utils = require('../../util/util');

const OPTIONS = {
  'handshakeTimeout': 12000,
  rejectUnauthorized: false
};

const logger = utils.getLogger('SendByWebSocket.js');
/**
 * @class
 * @classdesc  Common web socket used communication with external modules.
 */
class SendByWebSocket {
  /**
   * @constructor
   * @param {string} wsUrl  - The string of web socket URL.
   */
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.lockReconnect = false;
    this.functionDict = {};
    this.heartCheck();
    this.createWebSocket();
  }

  /**
   * Create a web socket object.
   */
  createWebSocket() {
    try {
      this.webSocket = new WebSocket(this.wsUrl, OPTIONS);
      this.initEventHandle();
    } catch (e) {
      this.reconnect();
    }
  }

  /**
   * Init the event for re-connect  web socket.
   */
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

  /**
   * Using ping-pong to check heart beating.
   */
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

  /**
   * reconnect web socket when connection is broken.
   */
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

  /**
   * close web socket from sdk.
   */
  close() {
    this.webSocket.close();
  }

  /**
   * Send data to server end.
   * @param {Object} data - The data is instance of class {@link MessageTemplate MessageTemplate}
   */
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

  /**
   *
   * @param {Object} message - message response from API server.
   */
  getMessage(message) {
    logger.debug("Recieve message is: %s",JSON.stringify(message));
    this.functionDict[message.header.index].onMessage(message);
    delete this.functionDict[message.header.index];
  }

  /**
   *
   * @param {Array} args  - The arguments for build message sent to API server.
   */
  sendMessage(...args) {
    let message = this.createMessage(...args);
    this.functionDict[message.message.header.index] = message;
    //logDebug.debug(`sendMessage: `,message.message);
    this.webSocket.send(JSON.stringify(message.message));

  }

  /**
   * Build message sent to API server
   * @param {Array} args  - The arguments for build message sent to API server.
   * @returns {*}         - Instance of MessageTemplate.
   */
  createMessage(...args) {

    let [firstArg, ...rest] = args;
    return messageFactory[firstArg](...rest);
  }

  /**
   * Check the message is in the dic. or NOT
   * @param methodName
   * @returns {*}
   */
  hasMessage(methodName){
    return messageFactory[methodName];
  }
}

module.exports = SendByWebSocket;
