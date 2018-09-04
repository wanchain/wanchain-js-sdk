"use strict";

const WebSocket = require('ws');
const messageFactory = require('../webSocket/messageFactory');

const logDebug = global.getLogger('socketServer');
const OPTIONS = {
    'handshakeTimeout': 12000,
    rejectUnauthorized: false
};

class SendByWebSocket {
    constructor(wsUrl) {
        this.wsUrl = wsUrl;
        this.isConnection = false; 
        this.lockReconnect = false; 
        this.ping = null;
        this.functionDict = {};
        this.heartCheck();
        this.createWebSocket();
    }

    createWebSocket() {
        try {
            this.webSocket = new WebSocket(this.wsUrl, OPTIONS);
            this.initEventHandle();
        } catch (e) {
            this.isConnection = false;
            this.reconnect(this.wsUrl);
        }
    }

    initEventHandle() {
        this.webSocket.onmessage = (message) => {
            this.heartCheck.start();

            // logDebug.log(`webSocket on message: ${message.data}`);

            let value = JSON.parse(message.data);
            this.getMessage(value);
        };

        this.webSocket.onopen = () => {
            // logDebug.log("webSocket on onopen");

            this.isConnection = true;
            clearInterval(this.ping);
            this.ping = setInterval(() => {
                this.sendPing('{"event": "ping"}')
            }, 10000);
            this.heartCheck.start();
        };

        this.webSocket.onclose = () => {
            // logDebug.log("webSocket onClose");

            this.isConnection = false;
            this.reconnect(this.wsUrl);
        };

        this.webSocket.onerror = () => {
            // logDebug.error(`webSocket onError: ${error}`);

            this.isConnection = false;
            this.reconnect(this.wsUrl);
        };
    }

    heartCheck() {
        let that = this;
        this.heartCheck = {
            timeout: 10000,
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
                    that.sendPing('{"event": "ping"}');

                    self.serverTimeoutObj = setTimeout(function () {
                        that.webSocket.close();
                    }, self.timeout);
                }, this.timeout);
            }
        };
    }

    reconnect(url) {
        if (this.lockReconnect) {
            return;
        }
        this.lockReconnect = true;
        setTimeout(() => {
            this.createWebSocket(url);
            this.lockReconnect = false;
        }, 2000);
    }

    sendPing(cmd) {
        if (!cmd) {
            return;
        }
        if (this.webSocket.readyState === 1) {
            this.webSocket.send(cmd);
        }
    }

    close() {
        console.log("Entering connection close!.....");
        this.webSocket.close();
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
        this.webSocket.send(JSON.stringify(message.message));
        // logDebug.debug(`sendMessage: ${message.message}`);
    }

    createMessage(...args) {
        // logDebug.debug(`createMessage: ${args}`);
        let [firstArg, ...rest] = args;
        return messageFactory[firstArg](...rest);
    }
}

module.exports = SendByWebSocket;