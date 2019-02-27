"use strict";
const { SendByWebSocket, SendByWeb3}  = require('../sender');
let CrossInvoker                      = require('./CrossInvoker');
let WanDb                             = require('../db/wandb');
let BTCWalletDB                       = require('../db/btcwalletdb');
let ccUtil                            = require('../api/ccUtil');
const mr                              = require('./monitor.js').MonitorRecord;
const mrNormal                        = require('./monitorNormal').MonitorRecordNormal;
const mrBtc                           = require('./monitorBtc').MonitorRecordBtc;
let  sdkConfig                        = require('../conf/config');
let  lodash                           = require('lodash');
let  Logger                           = require('../logger/logger');
const path                            =require('path');

let montimer  = null;
let montimerNormal  = null;
let montimerBtc     = null;

/**
 * @class
 * @classdesc  Manage all the modules of SDK.
 */
class WalletCore {
  /**
   * @constructor
   * @param config  - SDK users' config, if variable in both config and sdk config, users config overrides SDK config.
   */
  constructor(config){
    let wcConfig = {};
    // in initDB system will change sdkConfig databasePath, this leads the function is not re-entering.
    this.config = lodash.extend(wcConfig,sdkConfig, config);
  }

  /**
   *
   * @returns {Promise<void>}
   */
  async recordMonitor(){
    mr.init(this.config);
    if(montimer){
      clearInterval(montimer);
    }
    montimer = setInterval(function(){
      mr.monitorTask();
    }, 10000);
  }

  /**
   *
   * @returns {Promise<void>}
   */
  async recordMonitorNormal(){
    mrNormal.init(this.config);
    if(montimerNormal){
      clearInterval(montimerNormal);
    }
    montimerNormal = setInterval(function(){
      mrNormal.monitorTaskNormal();
    }, 15000);
  }

  /**
   *
   * @returns {Promise<void>}
   */
  async recordMonitorBTC(){
    mrBtc.init(this.config);
    if(montimerBtc){
      clearInterval(montimerBtc);
    }
    montimerBtc = setInterval(function(){
      mrBtc.monitorTaskBtc();
    }, 10000);
  }

  /**
   *
   * @returns {Promise<void>}
   */
  async init() {
    await this.initLogger();
    try{
      // initial the socket and web3
      await  this.initSender();
    }catch(err){
      global.logger.error("error WalletCore::initSender ,err:",err);
      //process.exit();
    }
    if(this.config.useLocalNode === true){
      this.initWeb3Sender();
    }
    try{
      await  this.initCrossInvoker();
    }catch(err){
      global.logger.error("error WalletCore::initCrossInvoker ,err:",err);
      //process.exit();
    }
    try{
      await  this.initGlobalScVar();
    }catch(err){
      global.logger.error("error WalletCore::initGlobalScVar ,err:",err);
      //process.exit();
    }
    try{
      await  this.initDB();
    }catch(err){
      global.logger.error("error WalletCore::initDB ,err:",err);
      //process.exit();
    }

    global.mutexNonce                = false;

    global.mapAccountNonce           = new Map();
    global.mapAccountNonce.set('ETH',new Map());
    global.mapAccountNonce.set('WAN',new Map());
    global.mapAccountNonce.set('BTC',new Map());

    global.pendingTransThreshold  = this.config.pendingTransThreshold;

    global.logger.info("Final config is :\n");
    global.logger.info(this.config);
    global.logger.info("global.wanchain_js_sdk_testnet = ",global.wanchain_js_testnet);

    await  this.recordMonitor();
    await  this.recordMonitorNormal();
    await  this.recordMonitorBTC();
  };

  /**
   *
   */
  close(){
    global.logger           = null;
    global.sendByWebSocket  = null;
    global.crossInvoker     = null;
    global.lockedTime       = null;
    global.lockedTimeE20    = null;
    global.lockedTimeBTC    = null;
    global.coin2WanRatio    = null;
    global.nonceTest        = null;
    global.wanDb            = null;
    global.btcWalletDB      = null;
    /**
     * Monitor logger for monitoring the status of cross chain.
     * @global
     * @type {object}
     */
    global.mrLogger         = null;
    /**
     * Monitor logger for monitoring the status of normal transaction.
     * @global
     * @type {object}
     */
    global.mrLoggerNormal   = null;
    global.sendByWeb3       = null;
  };

  /**
   *
   * @returns {Promise<void>}
   */
  async initLogger(){
    let config = this.config;
    if(config.logPathPrex !== ''){
      config.ccLog        = path.join(config.logPathPrex,'crossChainLog.log');
      config.ccErr        = path.join(config.logPathPrex,'crossChainErr.log');

      config.mrLog        = path.join(config.logPathPrex,'ccMonitorLog.log');
      config.mrErr        = path.join(config.logPathPrex,'ccMonitorErr.log');

      config.mrLogNormal  = path.join(config.logPathPrex,'ccMonitorLogN.log');
      config.mrErrNormal  = path.join(config.logPathPrex,'ccMonitorErrN.log');

      config.mrLogBtc     = path.join(config.logPathPrex,'ccMonitorLogB.log');
      config.mrErrBtc     = path.join(config.logPathPrex,'ccMonitorErrB.log');
    }else{
      config.ccLog        = path.join('logs', 'crossChainLog.log');
      config.ccErr        = path.join('logs', 'crossChainErr.log');

      config.mrLog        = path.join('logs', 'ccMonitorLog.log');
      config.mrErr        = path.join('logs', 'ccMonitorErr.log');

      config.mrLogNormal  = path.join('logs', 'ccMonitorLogN.log');
      config.mrErrNormal  = path.join('logs', 'ccMonitorErrN.log');

      config.mrLogBtc     = path.join('logs', 'ccMonitorLogB.log');
      config.mrErrBtc     = path.join('logs', 'ccMonitorErrB.log');
    }

    config.logfileName  = config.ccLog;
    config.errfileName  = config.ccErr;

    config.logfileNameMR  = config.mrLog;
    config.errfileNameMR  = config.mrErr;

    config.logfileNameMRN  = config.mrLogNormal;
    config.errfileNameMRN  = config.mrErrNormal;

    config.logfileNameMRB  = config.mrLogBtc;
    config.errfileNameMRB  = config.mrErrBtc;
    /**
     * @global
     * @type {Logger}
     */
    global.logger = new Logger("CrossChain",this.config.logfileName, this.config.errfileName,this.config.loglevel);


  };

  /**
   *
   * @returns {Promise<any>}
   */
  async initSender(){
    global.logger.info(this.config.socketUrl);
    let sendByWebSocket  = new SendByWebSocket(this.config.socketUrl);
    return new Promise(function(resolve, reject){
      sendByWebSocket.webSocket.on('error', (err) => {
        reject(err);
      });
      sendByWebSocket.webSocket.on('open', () => {
        global.logger.info("connect API server success!");
        /**
         * @global
         * @type {SendByWebSocket}
         */
        global.sendByWebSocket = sendByWebSocket;
        global.logger.info("set global web socket end!");
        resolve('success');
      })
    })
  };

  /**
   *
   */
  initWeb3Sender(){
    global.logger.info("Entering initWeb3Sender");
    global.logger.info(this.config.rpcIpcPath);
    let sendByWeb3    = new SendByWeb3(this.config.rpcIpcPath);
    /**
     * @global
     * @type {SendByWeb3}
     */
    global.sendByWeb3 = sendByWeb3;
  };

  /**
   *
   * @returns {Promise<void>}
   */
  async initCrossInvoker(){
    global.logger.info("Entering initCrossInvoker");
    let crossInvoker     = new CrossInvoker(this.config);
    await crossInvoker.init();
    /**
     * @global
     * @type {CrossInvoker}
     */
    global.crossInvoker = crossInvoker;
  };

  /**
   *
   * @returns {Promise<void>}
   */
  async initGlobalScVar() {
    global.logger.info("Entering initGlobalScVar");
    try {
      /**
       * Htlc locked time, unit: second
       * @global
       */
      global.lockedTime           = await ccUtil.getEthLockTime(); // unit s
      /**
       * Htlc locked time of ERC20 , unit: second.
       * @global
       */
      global.lockedTimeE20        = await ccUtil.getE20LockTime(); // unit s
      /**
       * Htlc locked time of BTC , unit: second.
       * @global
       */
      global.lockedTimeBTC        = await ccUtil.getWanLockTime(); // unit s
      /**
       * ERC20 token's ratio to wan coin.
       * @global
       */
      global.coin2WanRatio        = await ccUtil.getEthC2wRatio();
      /**
       * BTC ration to wan coin.
       * @global
       */
      global.btc2WanRatio         = await ccUtil.getBtcC2wRatio();

      global.nonceTest            = 0x0;          // only for test.
      global.logger.debug("global.lockedTime global.lockedTimeE20 global.lockedTimeBTC ",
                      global.lockedTime,global.lockedTimeE20, global.lockedTimeBTC);

    } catch (err) {
      global.logger.error("initGlobalScVar error");
      global.logger.error(err);
    };
  }

  /**
   *
   * @returns {Promise<void>}
   */
  async initDB(){
    global.logger.info("Entering initDB");
    try{
      let config = this.config;
      if(config.databasePathPrex === ''){
        config.databasePath       =  path.join(config.databasePath, 'LocalDb');
      }else{
        config.databasePath       =  config.databasePathPrex;
      }
      /**
       * @global
       * @type {Wandb}
       */
      global.wanDb = new WanDb(this.config.databasePath,this.config.network);
      /**
       * @global
       * @type {BTCWalletDB}
       */
      global.btcWalletDB = new BTCWalletDB(this.config.databasePath,this.config.network);

      global.logger.info("initDB path");
      global.logger.info(this.config.databasePath);
    }catch(err){
      global.logger.error("initDB error!");
      global.logger.error(err);
    }
  }
}
module.exports = global.WalletCore = WalletCore;

