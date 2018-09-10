"use strict";
const { SendByWebSocket, SendByWeb3}  = require('../sender');
let CrossInvoker                      = require('./CrossInvoker');
class WalletCore {
  constructor(config){
    this.config = config;
  }

  async init() {
    // initial the socket and web3
    await  this.initSender();
    await  this.initCrossInvoker();
    await  this.initGlobalScVar();

  };
  async initSender(){
    console.log(this.config.socketUrl);
    let sendByWebSocket  = new SendByWebSocket(this.config.socketUrl);
    return new Promise(function(resolve, reject){
      sendByWebSocket.webSocket.on('error', (err) => {
        reject(err);
      });
      sendByWebSocket.webSocket.on('open', async() => {
        console.log("connect API server success!");
        global.sendByWebSocket = sendByWebSocket;
        // console.log(global.sendByWebSocket);
        console.log("set global web socket end!");
        resolve('success');
      })
    })
  };
  async initCrossInvoker(){
    let crossInvoker     = new CrossInvoker(this.config);
    await crossInvoker.init();
    global.crossInvoker = crossInvoker;
  };
  async initGlobalScVar() {
    try {
      global.lockedTime = await ccUtil.getEthLockTime();
      global.coin2WanRatio = await ccUtil.getEthC2wRatio();
    } catch (err) {
      console.log("initGlobalScVar error");
      console.log(err);
    }
    ;
  }
}
module.exports = global.WalletCore = WalletCore;

