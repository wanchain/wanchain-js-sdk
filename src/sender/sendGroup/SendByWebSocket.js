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
            // this.heartCheck.start();

            // logDebug.log(`webSocket on message: ${message.data}`);
            console.log("on message :", message.data);
            let value = JSON.parse(message.data);
            this.getMessage(value);
        };

        this.webSocket.onopen = () => {
            // logDebug.log("webSocket on onopen");

            this.isConnection = true;
            // clearInterval(this.ping);
            // this.ping = setInterval(() => {
            //     this.sendPing('{"event": "ping"}')
            // }, 10000);
            // this.heartCheck.start();
        };

        this.webSocket.onclose = () => {
            // logDebug.log("webSocket onClose");

            this.isConnection = false;
            // this.reconnect(this.wsUrl);
        };

        this.webSocket.onerror = () => {
            // logDebug.error(`webSocket onError: ${error}`);

            this.reconnect();
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
        console.log("Entering connection close!.....");
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
        logDebug.debug(`sendMessage: `,message.message);
        this.webSocket.send(JSON.stringify(message.message));

    }

    createMessage(...args) {
        // logDebug.debug(`createMessage: ${args}`);

        let [firstArg, ...rest] = args;
        return messageFactory[firstArg](...rest);
    }
}

module.exports = SendByWebSocket;