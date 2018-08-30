'use strict';

const net = require('net');
const Web3 = require('web3');

class SendByWeb3 {
    constructor(web3url, online = true) {
        if (web3url) {
            this.chainType = 'WAN';
            this.online = online;
            this.web3 = new Web3(new Web3.providers.IpcProvider(web3url, net));
        }
    }

    send(trans, password, callback) {
        if (this.online) {
            this.sendOnChain(trans, password, callback);
        } else {
            this.sendRawTrans(trans, password, callback);
        }
    }

    sendOnChain(trans, password, callback) {
        trans.send(this.web3, password, callback);
    }

    sendRawTrans(trans, password, callback) {
        let rawTx = trans.signFromKeystore(password);
        trans.sendRaw(rawTx, callback);
    }
    
    getBalance(address, callBack) {
        this.web3.eth.getBalance(address, callBack);
    }
}

module.exports = SendByWeb3;