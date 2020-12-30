"use strict";
const { SendByWebSocket, SendByWeb3, iWanRPC }  = require('../sender');
let CrossInvoker = require('./CrossInvoker');
let WanDb        = require('../db/wandb');
let BTCWalletDB  = require('../db/btcwalletdb');
let HDWalletDB   = require('../db/hdwalletdb');
let WanOTADB     = require('../db/wanotadb');
let ccUtil       = require('../api/ccUtil');
const mr         = require('./monitor.js').MonitorRecord;
const mrNormal   = require('./monitorNormal').MonitorRecordNormal;
// const mrBtc      = require('./monitorBtc').MonitorRecordBtc;
const mrOTA      = require('./monitorOTA').MonitorOTA;
let  sdkConfig   = require('../conf/config');
const path       = require('path');

var EventEmitter = require('events').EventEmitter;

const error = require('../api/error');

const utils = require('../util/util');

let ChainMgr = require("../hdwallet/chainmanager");

/**
 * Get logger after new wallet core, cause we need get logpath
 */
//let logger = utils.getLogger("main");
let logger = null;

/**
 * @class
 * @classdesc  Manage all the modules of SDK.
 */
class WalletCore extends EventEmitter {
  /**
   * @constructor
   * @param config  - SDK users' config, if variable in both config and sdk config, users config overrides SDK config.
   */
  constructor(config){
    super();
    // in initDB system will change sdkConfig databasePath, this leads the function is not re-entering.
    this.config = sdkConfig.mustInitConfig(config)

    this._init();
  }

  _init() {
      /**
       * Logging configuration
       */
      global.WalletCore = this;
      global.crossChainReady = true;

      let logpath = '/var/log';
      let datapath = path.join(this.config.databasePath, 'LocalDb');

      if (this.config.logPathPrex !== '') {
          logpath = this.config.logPathPrex;
      }

      if (this.config.databasePathPrex !== '') {
          datapath = this.config.databasePathPrex;
      }

      utils.setConfigSetting("path:logpath", logpath);
      utils.setConfigSetting("path:datapath", datapath);

      let logging = utils.getConfigSetting("logging", {});

      let logfile  = this.config.logfile;

      if (this.config.loglevel !== '') {
          logging.level = this.config.loglevel;
      }

      if (this.config.logtofile === true) {
          if (typeof this.config.logfile === 'string' && this.config.logfile != '') {
              logging.transport = this.config.logfile;
          } else {
              logging.transport = "wanwallet";
          }
      }

      utils.setConfigSetting("logging", logging);

      utils.resetLogger();

      logger = utils.getLogger("walletCore.js");

      if (this.config.network === 'testnet') {
          utils.setConfigSetting("wanchain:network", "testnet");
      } else {
          utils.setConfigSetting("wanchain:network", "mainnet");
      }

      //utils.setConfigSetting("bitcoinNetwork", this.config.bitcoinNetwork);
      utils.setConfigSetting("sdk:config", this.config);

      logger.info("Wallet running on '%s'.", utils.getConfigSetting("wanchain:network", "mainnet"));
  }

  /**
   *
   * @returns {Promise<void>}
   */
  async recordMonitor(){
    mr.init(this.config);
  }

  /**
   *
   * @returns {Promise<void>}
   */
  async recordMonitorNormal(){
    mrNormal.init(this.config);
  }

  /**
   *
   * @returns {Promise<void>}
   */
  async recordMonitorBTC(){
    mrBtc.init(this.config);
  }

  /**
   *
   * @returns {Promise<void>}
   */
  async recordMonitorOTA(){
      mrOTA.init(global.wanScanDB);
      global.OTAbackend = mrOTA;
  }
  /**
   *
   * @returns {Promise<void>}
   */
  async init() {
    logger.info("Starting walletCore initializing...");

    //await this.initLogger();

    await this.initIWAN();

    if(this.config.useLocalNode === true){
      this.initWeb3Sender();
    }
    try{
      await  this.initCrossInvoker();
    }catch(err){
      logger.error("error WalletCore::initCrossInvoker ,err:",err);
      global.crossChainReady = false;
      //process.exit();
    }
    // TODO
    // if (!(await this.initGlobalScVar())) {
    //   global.crossChainReady = false;
    // }

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
    global.mapAccountNonce.set('ETH', new Map());
    global.mapAccountNonce.set('WAN', new Map());
    global.mapAccountNonce.set('BTC', new Map());
    global.mapAccountNonce.set('EOS', new Map());

    global.pendingTransThreshold  = this.config.pendingTransThreshold;

    logger.debug("Final config is :\n");
    // logger.debug(JSON.stringify(this.config, null, 4));
    logger.debug(this.config);

    await  this.recordMonitor();
    await  this.recordMonitorNormal();
    // await  this.recordMonitorBTC();
    await  this.recordMonitorOTA();

    logger.info("walletCore initialization is completed");
  };

  /**
   *
   */
  close(){
      logger.info("Shuting down...")

      if (mr) {
          mr.shutdown();
      }

      if (mrNormal) {
          mrNormal.shutdown();
      }

      // if (mrBtc) {
      //     mrBtc.shutdown();
      // }

      if (mrOTA) {
          mrOTA.shutdown();

          // We shutdown
      }

      //
      // 2. Close manager, invoker, etc
      //
      if (global.crossInvoker) {
          // TODO: shutdown cross-invoker
          global.crossInvoker = null;
      }

      if (global.chainManager) {
          global.chainManager.shutdown();
          global.chainManager = null;
      }

      global.nonceTest = null;

      //
      // 3. Close database
      //
      if (global.wanDb) {
          global.wanDb = null;
      }

      if (global.btcWalletDB) {
          global.btcWalletDB = null;
      }

      if (global.hdWalletDB) {
          global.hdWalletDB = null;
      }

      //
      // 4. Close socket
      //
      if (this.config.useLocalNode && global.sendByWeb3) {
          // Close web3
          global.sendByWeb3 = null;
      }

      if (global.iWAN) {
          global.iWAN.close();

          global.iWAN = null;
      }

      // 5. Close logger
  };

  initHDChainManager() {
      global.chainManager = ChainMgr.NewManager(global.hdWalletDB.getWalletTable());
  }

  /**
   *
   * @returns {Promise<void>}
   */
  async initLogger(){
      throw new error.NotSupport("Init logger derpecate!!!")
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
   */
  async findFastIwan(urls, ports, key, secret, flag, version) {
    let timeout = 5000;
    let index = 0;

    if (urls.length !== 1) {
      let rpcPromiseArray = urls.map(async (url, index) => {
        let opt = {
          url : urls[index],
          port : ports[index],
          flag : flag,
          version : version
        }
        let rpc = {};
        rpc.index = index;
        let iWAN  = new iWanRPC(key, secret, opt);
        try {
          let startTime = Date.now();
          let result = await iWAN.call('getEpochID', timeout, ['WAN']);
          rpc.cost = Date.now() - startTime;
        } catch(err) {
          logger.error('%s error: %s', url, err.message)
          rpc.cost = timeout;
        }
        iWAN.close();
        return rpc;
      });
      logger.info(rpcPromiseArray)
      let rpcArray = await Promise.all(rpcPromiseArray);

      rpcArray.forEach(rpc => {
        logger.info('%s costs %d ms', urls[rpc.index], rpc.cost);
      })

      rpcArray.sort((a, b) => {
        return a.cost - b.cost;
      });
      index = rpcArray[0].index;
    }
    let timeoutForiWan = utils.getConfigSetting("network:timeout", 300000);
    let opt = {
      url : urls[index],
      port : ports[index],
      flag : flag,
      version : version,
      timeout : timeoutForiWan
    }
    let iWAN  = new iWanRPC(key, secret, opt);
    global.iWAN = iWAN;
    return;
  }

  /**
   */
  async initIWAN(){
    logger.info("Entering iWAN initialization...");

    let url = utils.getConfigSetting("sdk:config:iWAN:url", undefined);
    let port = utils.getConfigSetting("sdk:config:iWAN:port", 8443);
    let flag = utils.getConfigSetting("sdk:config:iWAN:flag", "ws");
    let version = utils.getConfigSetting("sdk:config:iWAN:version", "v3");

    let key = utils.getConfigSetting("sdk:config:iWAN:wallet:apikey", undefined);
    let secret = utils.getConfigSetting("sdk:config:iWAN:wallet:secret", undefined);

    if (!url || !key || !secret || url.length !== port.length) {
        logger.error("Initialize iWAN, missing url, key and/or secret!");
        throw new error.InvalidParameter("Initialize iWAN, missing url, key and/or secret!");
    }

    await this.findFastIwan(url, port, key, secret, flag, version);
    logger.info("iWAN initialization is completed.");

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
                           ccUtil.getWanLockTime(),
                           ccUtil.getC2WRatio('BTC'),
                           ccUtil.getEosChainInfo(),
                           ccUtil.getEosLockTime()];

      let timeout = utils.getConfigSetting("network:timeout", 300000);
      logger.info("Try to get %d SC parameters", promiseArray.length);
      let ret = await utils.promiseTimeout(timeout, Promise.all(promiseArray), 'Get smart contract parameters timed out!');

      if (ret.length != promiseArray.length) {
          logger.error("Get parameter failed: count mismatch");
          throw new error.RuntimeError("Get parameter failed: count mismatch");
      }

      global.lockedTime = ret[0];
      global.lockedTimeBTC = ret[1];
      global.btc2WanRatio  = ret[2];
      global.eosChainId = ret[3].chain_id;
      global.lockedTimeEOS = ret[4][3];

      utils.setConfigSetting("wanchain:crosschain:locktime", global.lockedTime);
      utils.setConfigSetting("wanchain:crosschain:btclocktime", global.lockedTimeBTC);
      utils.setConfigSetting("wanchain:crosschain:bt2wanRatio", global.btc2WanRatio);

      global.nonceTest = 0x0;          // only for test.
      logger.info("lockedTime=%d, lockedTimeBTC=%d, btc2WanRatio=%d, lockedTimeEOS=%d, eosChainId=%s",
                   global.lockedTime,
                   global.lockedTimeBTC,
                   global.btc2WanRatio,
                   global.lockedTimeEOS,
                   global.eosChainId);

      logger.info("initGlobalScVar is completed");
      return true;
    } catch (err) {
      logger.error("Caught error in initGlobalScVar: ", err);
      return false;
    };

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

      let walletPath = config.databasePath;
      if(config.walletPathPrex){
          walletPath = config.walletPathPrex;
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
      global.hdWalletDB = new HDWalletDB(walletPath, this.config.network, this.config.dbExtConf);

      /**
       * OTA database for WAN private transaction
       */
      global.wanScanDB = new WanOTADB(this.config.databasePath, this.config.network);

      logger.info("Database path: ", this.config.databasePath);
    }catch(err){
      logger.error("Caught error in initDB: ", err);
    }
    logger.info("initDB is completed");
  }
}
module.exports = WalletCore;

