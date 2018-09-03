"use strict";

const WebSocket = require('ws');
const messageFactory = require('../webSocket/messageFactory');

const logDebug = global.getLogger('socketServer');
const OPTIONS = {
  'handshakeTimeout': 12000,
  rejectUnauthorized: false        // add by Jacob for cerficate error!
};

class SendByWebSocket {
    constructor(url) {
        this.connection = new WebSocket(url, OPTIONS);
        this.connection.onerror = (error) => {
            logDebug.error(`[+webSocket onError+] ${error}`);
        };
        this.connection.onmessage = (message) => {
            console.log("SendByWebSocket on message:");
            console.log(message);
            let value = JSON.parse(message.data);
            console.log("SendByWebSocket on message:");
            console.log(value);
            this.getMessage(value);
        };
        this.connection.onclose = (message)=>{
          console.log("SendByWebSocket on onclose:");
          //console.log(message.data);
        };
        this.connection.onopen = (message)=>{
          console.log("SendByWebSocket on onopen:");
          //console.log(message);
        };
        this.functionDict = {};
    }

    close() {
        console.log("Entering connection close!.....");
        this.connection.close();
    }
    
    getMessage(message) {
        this.functionDict[message.header.index].onMessage(message);
        delete this.functionDict[message.header.index];
    }

    sendMessage(...args) {
        console.log("Entering sendMessage");
        let message = this.createMessage(...args);
        console.log("message created");
        this.functionDict[message.message.header.index] = message;
        console.log("json = ");
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