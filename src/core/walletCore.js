"use strict";
const { SendByWebSocket, SendByWeb3}  = require('../sender');
let CrossInvoker                      = require('./CrossInvoker');
let WanDb                             = require('../db/wandb');
let BTCWalletDB                       = require('../db/btcwalletdb');
let HDWalletDB                        = require('../db/hdwalletdb');
let ccUtil                            = require('../api/ccUtil');
const mr                              = require('./monitor.js').MonitorRecord;
const mrNormal                        = require('./monitorNormal').MonitorRecordNormal;
const mrBtc                           = require('./monitorBtc').MonitorRecordBtc;
let  sdkConfig                        = require('../conf/config');
let  Logger                           = require('../logger/logger');
const path                            =require('path');

const wanUtil = require('../util/util');

let ChainMgr = require("../hdwallet/chainmanager");

let montimer  = null;
let montimerNormal  = null;
let montimerBtc     = null;

/**
 * Get logger after new wallet core, cause we need get logpath
 */ 
//let logger = wanUtil.getLogger("main");
let logger = null;

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
    // in initDB system will change sdkConfig databasePath, this leads the function is not re-entering.
    this.config = sdkConfig.mustInitConfig(config)

    this._init();
  }

  _init() {
      /**
       * Logging configuration
       */
      let logpath = '/var/log';
      let datapath = path.join(this.config.databasePath, 'LocalDb');

      if (this.config.logPathPrex !== '') {
          logpath = this.config.logPathPrex;
      }

      if (this.config.databasePathPrex !== '') {
          datapath = this.config.databasePathPrex;
      }

      wanUtil.setConfigSetting("path.logpath", logpath);
      wanUtil.setConfigSetting("path.datapath", datapath);

      let logging = wanUtil.getConfigSetting("logging", {});

      let logfile  = this.config.logfile;

      if (this.config.loglevel !== '') {
          logging.level = this.config.loglevel;
      }

      if (this.config.logtofile === true) {
          if (this.config.logfile !== '') {
              logging.transport = this.config.logfile;
          } else {
              logging.transport = "wanwallet.log";
          }
      }

      wanUtil.setConfigSetting("logging", logging);

      logger = wanUtil.getLogger("walletCore.js");

      if (this.config.network === 'testnet') {
          wanUtil.setConfigSetting("wanchain.network", "testnet");
      } else {
          wanUtil.setConfigSetting("wanchain.network", "mainnet");
      }

      wanUtil.setConfigSetting("bitcoinNetwork", this.config.bitcoinNetwork);
      wanUtil.setConfigSetting("sdk.config", this.config);

      logger.info("Wallet running on '%s'.", wanUtil.getConfigSetting("wanchain.network", "mainnet"));
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
    logger.info("Starting walletCore initializing...");

    await this.initLogger();
    try{
      // initial the socket and web3
      await  this.initSender();
    }catch(err){
      logger.error("error WalletCore::initSender ,err:",err);
      //process.exit();
    }
    if(this.config.useLocalNode === true){
      this.initWeb3Sender();
    }
    try{
      await  this.initCrossInvoker();
    }catch(err){
      logger.error("error WalletCore::initCrossInvoker ,err:",err);
      //process.exit();
    }
    try{
      await  this.initGlobalScVar();
    }catch(err){
      logger.error("error WalletCore::initGlobalScVar ,err:",err);
      //process.exit();
    }
    try{
      await  this.initDB();
    }catch(err){
      logger.error("error WalletCore::initDB ,err:",err);
      //process.exit();
    }

    // HD chain manager initialization
    this.initHDChainManager();

    global.mutexNonce                = false;

    global.mapAccountNonce           = new Map();
    global.mapAccountNonce.set('ETH',new Map());
    global.mapAccountNonce.set('WAN',new Map());
    global.mapAccountNonce.set('BTC',new Map());

    global.pendingTransThreshold  = this.config.pendingTransThreshold;

    logger.debug("Final config is :\n");
    logger.debug(JSON.stringify(this.config, null, 4));

    await  this.recordMonitor();
    await  this.recordMonitorNormal();
    await  this.recordMonitorBTC();

    logger.info("walletCore initialization is completed");
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
    global.hdWalletDB       = null;
    global.chainManager     = null;
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

  initHDChainManager() {
      global.chainManager = ChainMgr.NewManager(global.hdWalletDB.getWalletTable());
  }

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
    logger.info("Entering initSender...");
    logger.info("Socket URL='%s'", this.config.socketUrl);

    let sendByWebSocket  = new SendByWebSocket(this.config.socketUrl);
    logger.info("initSender is completed.");

    return new Promise(function(resolve, reject){
      sendByWebSocket.webSocket.on('error', (err) => {
        reject(err);
      });
      sendByWebSocket.webSocket.on('open', () => {
        logger.info("connect API server success!");
        /**
         * @global
         * @type {SendByWebSocket}
         */
        global.sendByWebSocket = sendByWebSocket;
        logger.info("set global web socket end!");
        resolve('success');
      })
    });

  };

  /**
   *
   */
  initWeb3Sender(){
    logger.info("Entering initWeb3Sender...");
    logger.info("IPC path: %s", this.config.rpcIpcPath);
    let sendByWeb3    = new SendByWeb3(this.config.rpcIpcPath);
    /**
     * @global
     * @type {SendByWeb3}
     */
    global.sendByWeb3 = sendByWeb3;
    logger.info("initWeb3Sender is completed.");
  };

  /**
   *
   * @returns {Promise<void>}
   */
  async initCrossInvoker(){
    logger.info("Entering initCrossInvoker...");
    let crossInvoker     = new CrossInvoker(this.config);
    await crossInvoker.init();
    /**
     * @global
     * @type {CrossInvoker}
     */
    global.crossInvoker = crossInvoker;
    logger.info("initCrossInvoker is completed");
  };

  /**
   *
   * @returns {Promise<void>}
   */
  async initGlobalScVar() {
    logger.info("Entering initGlobalScVar...");
    try {
      /**
       * Htlc locked time, unit: second
       * @global
       */
      let promiseArray = [ ccUtil.getEthLockTime(),
                           ccUtil.getE20LockTime(),
                           ccUtil.getWanLockTime(),
                           ccUtil.getEthC2wRatio(),
                           ccUtil.getBtcC2wRatio() ];
  
      let timeout = wanUtil.getConfigSetting("network.timeout", 300000);   
      logger.info("Try to get %d SC parameters", promiseArray.length); 
      let ret = await wanUtil.promiseTimeout(timeout, Promise.all(promiseArray));

      if (ret.length != promiseArray.length) {
          logger.error("Get parameter failed: count mismatch");
          throw new Error("Get parameter failed: count mismatch");
      }

      global.lockedTime = ret[0];
      global.lockedTimeE20 = ret[1];
      global.lockedTimeBTC = ret[2];
      global.coin2WanRatio = ret[3];
      global.btc2WanRatio  = ret[4];

      global.nonceTest = 0x0;          // only for test.
      logger.debug("lockedTime=%d, lockedTimeE20=%d, lockedTimeBTC=%d, coin2WanRatio=%d, btc2WanRatio=%d",
                   global.lockedTime,
                   global.lockedTimeE20, 
                   global.lockedTimeBTC, 
                   global.coin2WanRatio,
                   global.btc2WanRatio);

    } catch (err) {
      logger.error("Caught error in initGlobalScVar: ", err);
    };

    logger.info("initGlobalScVar is completed");
  }

  /**
   *
   * @returns {Promise<void>}
   */
  async initDB(){
    logger.info("Entering initDB...");
    try{
      let config = this.config;
      if(config.databasePathPrex === ''){
        config.databasePath = path.join(config.databasePath, 'LocalDb');
      }else{
        config.databasePath = config.databasePathPrex;
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
      /**
       * HD wallet to store mnemonic
       * Should we different main net from testnet?
       */
      global.hdWalletDB = new HDWalletDB(this.config.databasePath);

      logger.info("Database path: ", this.config.databasePath);
    }catch(err){
      logger.error("Caught error in initDB: ", err);
    }
    logger.info("initDB is completed");
  }
}
module.exports = global.WalletCore = WalletCore;

