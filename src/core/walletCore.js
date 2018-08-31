"use strict";

const util = require('../api/util');
const trans = require('../trans');
const baseCfg = require('../conf/config');
const { KeystoreDir } = require('../keystore');
const { SendFromSocket, SendFromWeb3, SocketServer} = require('../sender');

class WalletCore {
    constructor(config, chain, logger){
        global.config = this.config = Object.assign(baseCfg, config);
        global.getLogger = logger;
        this.chain = chain;
        this.trans = trans;
        this.util = util;
        this.init();
    }
 
    async init() {
        this.config.crosschainDir = new KeystoreDir(this.config.crosschainPath);
        this.config.wanDir = new KeystoreDir(this.config.WanPath);

        this.socket = global.socket = new SocketServer(this.config.socketUrl);
        this.sender = global.sender = new sendFromSocket(this.socket, this.chain);

        socket.connection.on('error', (err) => {
            this.socket = global.socket = new SocketServer(this.config.socketUrl);
        });
        socket.connection.on('open', () => {
            if (this.config.useLocalNode && !this.web3Sender) {
                this.web3Sender = this.createWeb3Sender(this.config.rpcIpcPath);
            }
        });
        try {
            [this.config.lockedTime, this.config.c2wRatio] = await Promise.all([util.getEthLockTime(this.sender), util.getEthC2wRatio(this.sender)]);            
        } catch(err) {
            console.log(err);
        }
        this.db = global.db = util.initDb(this.config, sender);
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
