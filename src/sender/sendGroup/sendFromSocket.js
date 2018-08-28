"use strict";

const SocketServer = require('../webSocket/socketServer');
const logDebug = global.getLogger('socketmessage');

class SendFromSocket {
    constructor(socket, chainType) {
        this.socket = socket;
        this.chainType = chainType;
    }

    close() {
        this.socket.close();
    }

    send(trans, password, callback) {
        logDebug.debug(trans.trans);
        let rawTx = trans.signFromKeystore(password);
        logDebug.debug('rawTx:', rawTx);
        if (rawTx) {
            this.socket.sendMessage('sendRawTransaction', rawTx, this.chainType, callback);
        } else {
            callback({
                error: 'wrong password'
            }, null);
        }
    }

    hasMessage(msg) {
        return this.socket.messageFactory[msg];
    }

    sendMessage(...args) {
        let len = args.length;
        args[len] = args[len - 1];
        args[len - 1] = this.chainType;
        this.socket.sendMessage(...args);
    }
}

module.exports = SendFromSocket;