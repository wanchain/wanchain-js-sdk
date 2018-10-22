"use strict";
const { SendByWebSocket, SendByWeb3}  = require('../sender');
let CrossInvoker                      = require('./CrossInvoker');
let WanDb                             = require('../db/wandb');
let ccUtil                            = require('../api/ccUtil');
const mr                              = require('./monitor.js').MonitorRecord;
const mrNormal                        = require('./monitorNormal').MonitorRecordNormal;
let  sdkConfig                        = require('../conf/config');
let  lodash                           = require('lodash');
let  Logger                           = require('../logger/logger');
const path                            =require('path');

let montimer  = null;
let montimerNormal  = null;
class WalletCore {
  constructor(config){
    this.config = lodash.extend(sdkConfig, config);
  }
  async recordMonitor(){
    mr.init(this.config);
    if(montimer){
      clearInterval(montimer);
    }
    montimer = setInterval(function(){
      mr.monitorTask();
    }, 10000);
  }
  async recordMonitorNormal(){
    mrNormal.init(this.config);
    if(montimerNormal){
      clearInterval(montimerNormal);
    }
    montimerNormal = setInterval(function(){
      mrNormal.monitorTaskNormal();
    }, 15000);
  }
  async init() {
    await this.initLogger();
    try{
      // initial the socket and web3
      await  this.initSender();
      if(this.config.useLocalNode === true){
        this.initWeb3Sender();
      }
      await  this.initCrossInvoker();
      await  this.initGlobalScVar();
      await  this.initDB();

      global.logger.info("Final config is :\n");
      global.logger.info(this.config);
      global.logger.info("global.wanchain_js_sdk_testnet = ",global.wanchain_js_testnet);

      await  this.recordMonitor();
      await  this.recordMonitorNormal();

    }catch(err){
      global.logger.error("error WalletCore::init ,err:",err);
      process.exit();
    }
  };
  close(){
    global.logger           = null;
    global.sendByWebSocket  = null;
    global.crossInvoker     = null;
    global.lockedTime       = null;
    global.lockedTimeE20    = null;
    global.coin2WanRatio    = null;
    global.nonceTest        = null;
    global.wanDb            = null;
    global.mrLogger         = null;
    global.mrLoggerNormal   = null;
    global.sendByWeb3       = null;
  };
  async initLogger(){
    let config = this.config;

    if(config.logPathPrex !== ''){
      config.ccLog        = path.join(config.logPathPrex,'crossChainLog.log');
      config.ccErr        = path.join(config.logPathPrex,'crossChainErr.log');

      config.mrLog        = path.join(config.logPathPrex,'ccMonitorLog.log');
      config.mrErr        = path.join(config.logPathPrex,'ccMonitorErr.log');

      config.mrLogNormal  = path.join(config.logPathPrex,'ccMonitorLogN.log');
      config.mrErrNormal  = path.join(config.logPathPrex,'ccMonitorErrN.log');
    }else{
      config.ccLog        = path.join('logs', 'crossChainLog.log');
      config.ccErr        = path.join('logs', 'crossChainErr.log');

      config.mrLog        = path.join('logs', 'ccMonitorLog.log');
      config.mrErr        = path.join('logs', 'ccMonitorErr.log');

      config.mrLogNormal  = path.join('logs', 'ccMonitorLogN.log');
      config.mrErrNormal  = path.join('logs', 'ccMonitorErrN.log');
    }

    config.logfileName  = config.ccLog;
    config.errfileName  = config.ccErr;

    config.logfileNameMR  = config.mrLog;
    config.errfileNameMR  = config.mrErr;

    config.logfileNameMRN  = config.mrLogNormal;
    config.errfileNameMRN  = config.mrErrNormal;
    global.logger = new Logger("CrossChain",this.config.logfileName, this.config.errfileName,this.config.loglevel);


  };
  async initSender(){
    global.logger.info(this.config.socketUrl);
    let sendByWebSocket  = new SendByWebSocket(this.config.socketUrl);
    return new Promise(function(resolve, reject){
      sendByWebSocket.webSocket.on('error', (err) => {
        reject(err);
      });
      sendByWebSocket.webSocket.on('open', () => {
        global.logger.info("connect API server success!");
        global.sendByWebSocket = sendByWebSocket;
        global.logger.info("set global web socket end!");
        resolve('success');
      })
    })
  };
  initWeb3Sender(){
    global.logger.info("Entering initWeb3Sender");
    global.logger.info(this.config.rpcIpcPath);
    let sendByWeb3    = new SendByWeb3(this.config.rpcIpcPath);
    global.sendByWeb3 = sendByWeb3;
  };
  async initCrossInvoker(){
    let crossInvoker     = new CrossInvoker(this.config);
    await crossInvoker.init();
    global.crossInvoker = crossInvoker;
  };
  async initGlobalScVar() {
    try {
      global.lockedTime           = await ccUtil.getEthLockTime(); // unit s
      global.lockedTimeE20        = await ccUtil.getE20LockTime(); // unit s
      global.coin2WanRatio        = await ccUtil.getEthC2wRatio();

      global.nonceTest            = 0x0;          // only for test.
      global.logger.debug("global.lockedTime global.lockedTimeE20 ",global.lockedTime,global.lockedTimeE20);

    } catch (err) {
      global.logger.error("initGlobalScVar error");
      global.logger.error(err);
    };
  }
  async initDB(){
    try{
      let config = this.config;
      if(config.databasePathPrex === ''){
        config.databasePath       =  path.join(config.databasePath, 'LocalDb');
      }else{
        config.databasePath       =  config.databasePathPrex;
      }

      global.wanDb = new WanDb(this.config.databasePath,this.config.network);
      global.logger.info("initDB path");
      global.logger.info(this.config.databasePath);
    }catch(err){
      global.logger.error("initDB error!");
      global.logger.error(err);
    }
  }
}
module.exports = global.WalletCore = WalletCore;

