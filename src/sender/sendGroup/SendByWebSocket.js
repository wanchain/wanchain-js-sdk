"use strict";

const WebSocket = require('ws');
const messageFactory = require('./messageFactory');

const logDebug = global.getLogger('socketServer');
const OPTIONS = { 'handshakeTimeout': 12000 };

class SendByWebSocket extends WebSocket {

    constructor(url) {
        super(url, OPTIONS);
        this.messageFactory = messageFactory;
        this.onerror = (error) => {
            logDebug.error(`[+webSocket onError+] ${error}`);
        };
        this.onmessage = (message) => {
            let value = JSON.parse(message.data);
            this.getmessage(value);
        };
        this.functionDict = {};
    }

    send(json) {
        this.send(JSON.stringify(json));
    }

    getMessage(message) {
        this.functionDict[message.header.index].onMessage(message);
        delete this.functionDict[message.header.index];
    }

    sendMessage(...args) {
        return this.sendMessageFunc(this.createMessageFunc(...args));
    }

    sendMessageFunc(message) {
        this.functionDict[message.message.header.index] = message;
        logDebug.debug(message.message);
        this.send(message.message);
    }

    createMessageFunc(...args) {
        logDebug.debug(`createMessageFunc : ${args}`);
        
        let [args1, ...rest] = args;
        return this.messageFactory[args1](...rest);
    }
}

module.exports = SendByWebSocket;