"use strict";

const wanchainTrans = require("./wanchainTrans");
const SendTransaction = require('./crossSend/sendTransaction');
const { Keystore } = require('./keystore');
const { SendFromSocket, SendFromWeb3, SocketServer} = require('./sender');


class WalletCore {
    constructor(config, chain, logger){
        global.getLogger = logger;
        this.chain = chain;
        this.config = config;
        this.wanchainTrans = wanchainTrans;
        this.crossKeystoreDir = global.crossKeystoreDir = new Keystore(config.crossKeystorePath);
        this.originalKeystoreDir =  global.originalKeystoreDir = new Keystore(config.originalKeystorePath);
    }
 
    init() {
        const socket = new SocketServer(this.config.socketUrl);

        this.crossSend = new SendFromSocket(socket, this.chain['cross']);
        this.originalSend = new SendFromSocket(socket, this.chain['original']);
        global.crossSend = this.crossSend;
        global.originalSend = this.originalSend;
        return new Promise((resolve, reject) => {
            socket.on('error', (err) => {
                reject(err);
            });
            socket.on('open', () => {
                resolve('success')
            })
        });
    }

    createSendTransaction(chainType) {
        let sender = chainType === 'WAN' ? this.originalSend : this.crossSend;
        return new SendTransaction(sender);
    }

    createSender(chainType) {
        if (this.config.socketUrl) {
            return new SendFromSocket(new SocketServer(this.config.socketUrl), chainType);
        }
    }

    createWeb3Sender(url) {
        return new SendFromWeb3(url);
    }

}

module.exports = global.WalletCore = WalletCore;
