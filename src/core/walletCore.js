"use strict";
const { SendByWebSocket, SendByWeb3}  = require('../sender');
let CrossInvoker                      = require('./CrossInvoker');
let WanDb                             = require('../db/wandb');
let ccUtil                            = require('../api/ccUtil');
const mr                              =  require('./monitor.js').MonitorRecord;

let montimer  = null;
class WalletCore {
  constructor(config){
    this.config = config;
  }
  async recordMonitor(){
    mr.init(this.config);
    if(montimer){
      clearInterval(montimer);
    }
    montimer = setInterval(function(){
      mr.monitorTask();
    }, 16000);
  }
  async init() {
    // initial the socket and web3
    console.log("entering WalletCore::init");
    await  this.initSender();
    await  this.initCrossInvoker();
    await  this.initGlobalScVar();
    await  this.initDB();
    await  this.recordMonitor();
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
  async initDB(){
    try{
      global.wanDb = new WanDb(this.config.databasePath,this.config.network);
      console.log("initDB path");
      console.log(this.config.databasePath);
    }catch(err){
      console.log("initDB error!");
      console.log(err);
    }
  }
}
module.exports = global.WalletCore = WalletCore;

