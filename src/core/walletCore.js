"use strict";
const { SendByWebSocket, SendByWeb3}  = require('../sender');
let CrossInvoker                      = require('./CrossInvoker');
let WanDb                             = require('../db/wandb');
let ccUtil                            = require('../api/ccUtil');
const mr                              = require('./monitor.js').MonitorRecord;
let  sdkConfig                        = require('../conf/config');
let  lodash                           = require('lodash');
let  Logger                           = require('../logger/logger');

let montimer  = null;
class WalletCore {
  constructor(config){
    this.config = lodash.extend(sdkConfig, config);
    //global.logger.debug(this.config);
  }
  async recordMonitor(){
    mr.init(this.config);
    if(montimer){
      clearInterval(montimer);
    }
    montimer = setInterval(function(){
      mr.monitorTask();
    }, 5000);
  }
  async init() {
    // initial the socket and web3
    await this.initLogger();
    global.logger.debug("entering WalletCore::init");
    await  this.initSender();
    await  this.initCrossInvoker();
    await  this.initGlobalScVar();
    await  this.initDB();
    await  this.recordMonitor();
  };
  async initLogger(){
    global.logger = new Logger("CrossChain",this.config.logfileName, this.config.errfileName,this.config.loglevel);
  };
  async initSender(){
    global.logger.debug(this.config.socketUrl);
    let sendByWebSocket  = new SendByWebSocket(this.config.socketUrl);
    return new Promise(function(resolve, reject){
      sendByWebSocket.webSocket.on('error', (err) => {
        reject(err);
      });
      sendByWebSocket.webSocket.on('open', async() => {
        global.logger.info("connect API server success!");
        global.sendByWebSocket = sendByWebSocket;
        global.logger.info("set global web socket end!");
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
      global.lockedTime           = 1800; // unit s
      //global.lockedTime           = await ccUtil.getEthLockTime(); // unit s
      global.lockedTimeE20        = await ccUtil.getE20LockTime(); // unit s
      global.coin2WanRatio        = await ccUtil.getEthC2wRatio();

      global.nonceTest            = 0x0;          // only for test.
      global.logger.debug("global.lockedTime global.lockedTimeE20 ",global.lockedTime,global.lockedTimeE20);

    } catch (err) {
      global.logger.debug("initGlobalScVar error");
      global.logger.debug(err);
    }
    ;
  }
  async initDB(){
    try{
      global.wanDb = new WanDb(this.config.databasePath,this.config.network);
      global.logger.debug("initDB path");
      global.logger.debug(this.config.databasePath);
    }catch(err){
      global.logger.debug("initDB error!");
      global.logger.debug(err);
    }
  }
}
module.exports = global.WalletCore = WalletCore;

