"use strict";
const { SendByWebSocket, SendByWeb3} = require('./sender');
let sendByWebSocket = require('./globalVar').sendByWebSocket;
let sendByWeb3      = require('./globalVar').sendByWeb3;

class WalletCore {
    constructor(config){
        this.config = config;
    }
 
    init() {
        // initial the socket and web3
        sendByWebSocket  = new sendByWebSocket(config.socketUrl);
        sendByWeb3       = new sendByWeb3(config.config.rpcIpcPath);

        // initial db

        // initial crosschain input
        return new Promise((resolve, reject) => {
          sendByWebSocket.on('error', (err) => {
            reject(err);
          });
          sendByWebSocket.on('open', () => {
            resolve('success')
          })
        })
    }
}
module.exports = global.WalletCore = WalletCore;
