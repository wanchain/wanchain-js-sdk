"use strict";
const { SendByWebSocket, SendByWeb3} = require('../sender');

class WalletCore {
    constructor(config){
        this.config = config;
    }
 
    init() {
        // initial global.log
        // const log = global.getLogger("walletcore");
        // log.debug("log.debug test!")
        // initial the socket and web3
        console.log(this.config.socketUrl);
        let sendByWebSocket  = new SendByWebSocket(this.config.socketUrl);
        // console.log("global.sendByWebSocket === ");
        // console.log(global.sendByWebSocket);
        /*
        console.log(this.config.config.rpcIpcPath);
        sendByWeb3       = new SendByWeb3(this.config.config.rpcIpcPath);
        *
        */
        // initial db

        // initial crosschain input
        return new Promise((resolve, reject) => {
            sendByWebSocket.connection.on('error', (err) => {
            reject(err);
          });
            sendByWebSocket.connection.on('open', () => {
            console.log("connect API server success!");
              global.sendByWebSocket = sendByWebSocket;
              // console.log(global.sendByWebSocket);
              console.log("set global web socket end!");
              resolve('success');
          })
        })
    }
}
module.exports = global.WalletCore = WalletCore;

