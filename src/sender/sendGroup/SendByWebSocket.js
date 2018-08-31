"use strict";

const WebSocket = require('ws');
const messageFactory = require('../webSocket/messageFactory');

const logDebug = global.getLogger('socketServer');
const OPTIONS = { 'handshakeTimeout': 12000 };

class SendByWebSocket {
    constructor(url) {
        this.connection = new WebSocket(url, OPTIONS);
        this.connection.onerror = (error) => {
            logDebug.error(`[+webSocket onError+] ${error}`);
        };
        this.connection.onmessage = (message) => {
            let value = JSON.parse(message.data);
            this.getMessage(value);
        };
        this.functionDict = new Map();
    }

    close() {
        this.connection.close();
    }

    getMessage(message) {
        this.functionDict[message.header.index].onMessage(message);
        this.functionDict.delete(message.header.index);
    }

    sendMessage(...args) {
        let message = this.createMessage(...args);

        this.functionDict.set(message.message.header.index, message);
        this.connection.send(JSON.stringify(message.message));

        logDebug.debug(`sendMessage: ${message.message}`);
    }

    createMessage(...args) {
        logDebug.debug(`createMessage: ${args}`);
        
        let [firstArg, ...rest] = args;
        return messageFactory[firstArg](...rest);
    }
}

module.exports = SendByWebSocket;