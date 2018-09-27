'use strict'
const Web3                      = require("web3");
const WebSocket                 = require('ws');
const pu                        = require('promisefy-util');
const BigNumber                 = require('bignumber.js');
const wanUtil                   = require("wanchain-util");
const ethUtil                   = require("ethereumjs-util");
const ethTx                     = require('ethereumjs-tx');
const wanchainTx                = wanUtil.wanchainTx;

const keythereum                = require("keythereum");
const crypto                    = require('crypto');
const secp256k1                 = require('secp256k1');
const createKeccakHash          = require('keccak');
keythereum.constants.quiet      = true;
const config                    = require('../conf/config');
const net                       = require('net');
let   web3                      = new Web3(null);
let   KeystoreDir               = require('../keystore').KeystoreDir;
let   errorHandle               = require('../trans/transUtil').errorHandle;
let   retResult                 = require('../trans/transUtil').retResult;
let   SolidityEvent             = require("web3/lib/web3/event.js");



const ccUtil = {
  generatePrivateKey(){
    let randomBuf;
    do{
      randomBuf = crypto.randomBytes(32);
    }while (!secp256k1.privateKeyVerify(randomBuf));
    return '0x' + randomBuf.toString('hex');
  },
  getHashKey(key){
    //return BigNumber.random().toString(16);

    let kBuf = new Buffer(key.slice(2), 'hex');
//        let hashKey = '0x' + util.sha256(kBuf);
    let h = createKeccakHash('keccak256');
    h.update(kBuf);
    let hashKey = '0x' + h.digest('hex');
    // logDebug.debug('input key:', key);
    // logDebug.debug('input hash key:', hashKey);
    return hashKey;

  },
  /* function about Address         */
  createEthAddr(keyPassword){
    let params = { keyBytes: 32, ivBytes: 16 };
    let dk = keythereum.create(params);
    let options = {
      kdf: "scrypt",
      cipher: "aes-128-ctr",
      kdfparams: {
        n: 8192,
        dklen: 32,
        prf: "hmac-sha256"
      }
    };
    let keyObject = keythereum.dump(keyPassword, dk.privateKey, dk.salt, dk.iv, options);
    keythereum.exportToFile(keyObject,config.ethKeyStorePath);
    return keyObject.address;
  },
  createWanAddr(keyPassword) {
    let params = { keyBytes: 32, ivBytes: 16 };
    let options = {
      kdf: "scrypt",
      cipher: "aes-128-ctr",
      kdfparams: {
        n: 8192,
        dklen: 32,
        prf: "hmac-sha256"
      }
    };
    let dk = keythereum.create(params);
    let keyObject = keythereum.dump(keyPassword, dk.privateKey, dk.salt, dk.iv, options);

    let dk2 = keythereum.create(params);
    let keyObject2 = keythereum.dump(keyPassword, dk2.privateKey, dk2.salt, dk2.iv, options);
    keyObject.crypto2 = keyObject2.crypto;

    keyObject.waddress = wanUtil.generateWaddrFromPriv(dk.privateKey, dk2.privateKey).slice(2);
    keythereum.exportToFile(keyObject, config.wanKeyStorePath);
    return keyObject.address;
  },
  /* function about db              */
  getCrossdbCollection() {
    return this.getCollection(config.crossDbname,config.crossCollection);
  },
  getTxHistory(option) {
    this.collection = this.getCrossdbCollection();
    let Data = this.collection.find(option);
    let his = [];
    for(var i=0;i<Data.length;++i){
      let Item = Data[i];
      his.push(Item);
    }
    return his;
  },
  updateStatus(key, Status){
    let value = this.collection.findOne({HashX:key});
    if(value){
      value.status = Status;
      this.collection.update(value);
    }
  },

  getEthAccounts(){
    let ethAddrs = Object.keys(new KeystoreDir(config.ethKeyStorePath).getAccounts());
    return ethAddrs;
  },
  getWanAccounts(){
    let wanAddrs = Object.keys(new KeystoreDir(config.wanKeyStorePath).getAccounts());
    return wanAddrs;
  },
  async getEthAccountsInfo() {

    let bs;
    let ethAddrs = this.getEthAccounts();
    try {
      bs = await this.getMultiEthBalances(ethAddrs, 'ETH');
    }
    catch (err) {
      // logger.error("getEthAccountsInfo", err);
      return [];
    }
    let infos = [];
    for (let i = 0; i < ethAddrs.length; i++) {
      let info = {};
      info.balance = bs[ethAddrs[i]];
      info.address = ethAddrs[i];
      infos.push(info);
    }

    // logger.debug("Eth Accounts infor: ", infos);
    return infos;
  },
  async getWanAccountsInfo() {
    let wanAddrs = this.getWanAccounts();
    let bs = await this.getMultiWanBalances(wanAddrs, 'WAN');

    let infos = [];
    for (let i = 0; i < wanAddrs.length; i++) {
      let info = {};
      info.address = wanAddrs[i];
      info.balance = bs[wanAddrs[i]];
      infos.push(info);
    }

    // logger.debug("Wan Accounts infor: ", infos);
    return infos;
  },
  /* function about amount*/
  toGweiString(cwei){
    let exp = new BigNumber(10);
    let wei = new BigNumber(cwei);
    let gwei = wei.dividedBy(exp.pow(9));
    return gwei.toString(10);
  },
  calculateLocWanFee(value,coin2WanRatio,txFeeRatio){
    let wei     = web3.toWei(web3.toBigNumber(value));
    const DEFAULT_PRECISE = 10000;
    let fee = wei.mul(coin2WanRatio).mul(txFeeRatio).div(DEFAULT_PRECISE).div(DEFAULT_PRECISE).trunc();

    return '0x'+fee.toString(16);
  },

  /* function about API server      */
  getEthSmgList(chainType='ETH') {
    let b = pu.promisefy(global.sendByWebSocket.sendMessage, ['syncStoremanGroups',chainType], global.sendByWebSocket);
    return b;
  },
  getTxReceipt(chainType,txhash){
    let bs = pu.promisefy(global.sendByWebSocket.sendMessage, ['getTransactionReceipt',txhash,chainType], global.sendByWebSocket);
    return bs;
  },
  getTxInfo(chainType,txhash){
    let bs = pu.promisefy(global.sendByWebSocket.sendMessage, ['getTxInfo',txhash,chainType], global.sendByWebSocket);
    return bs;
  },

  parseLogs(logs, abi) {
    if (logs === null || !Array.isArray(logs)) {
      return logs;
    }
    let decoders = abi.filter(function (json) {
      return json.type === 'event';
    }).map(function(json) {
      // note first and third params only required only by enocde and execute;
      // so don't call those!
      return new SolidityEvent(null, json, null);
    });
    return logs.map(function (log) {
      let decoder = decoders.find(function(decoder) {
        return (decoder.signature() === log.topics[0].replace("0x",""));
      });
      if (decoder) {
        return decoder.decode(log);
      } else {
        return log;
      }
    });
  },
  // Event API

  getOutStgLockEvent(chainType, hashX,contractValue) {
    let topics = ['0x'+wanUtil.sha3(config.outStgLockEvent).toString('hex'), null, null, hashX];
    global.mrLogger.debug("getOutStgLockEvent topics ",topics);
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getScEvent', config.ethHtlcAddr, topics,chainType], global.sendByWebSocket);
    return p;
  },
  getInStgLockEvent(chainType, hashX,contractValue) {
    let topics = ['0x'+wanUtil.sha3(config.inStgLockEvent).toString('hex'), null, null, hashX];
    global.mrLogger.debug("getInStgLockEvent topics ",topics);
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getScEvent', config.wanHtlcAddr, topics,chainType], global.sendByWebSocket);
    return p;
  },

  getOutStgLockEventE20(chainType, hashX,contractValue) {
    let topics = ['0x'+wanUtil.sha3(config.outStgLockEventE20).toString('hex'), null, null, hashX,null,null];
    global.mrLogger.debug("getOutStgLockEventE20 topics ",topics);
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getScEvent', config.ethHtlcAddrE20, topics,chainType], global.sendByWebSocket);
    return p;
  },
  getInStgLockEventE20(chainType, hashX,contractValue) {
    let topics = ['0x'+wanUtil.sha3(config.inStgLockEventE20).toString('hex'), null, null, hashX,null,null];
    global.mrLogger.debug("getInStgLockEventE20 topics ",topics);
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getScEvent', config.wanHtlcAddrE20, topics,chainType], global.sendByWebSocket);
    return p;
  },
  // Time
  getDepositHTLCLeftLockedTime(chainType, hashX){
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['callScFunc', config.ethHtlcAddr, 'getHTLCLeftLockedTime',[hashX],config.HTLCETHInstAbi,chainType], global.sendByWebSocket);
    return p;
  },
  getWithdrawHTLCLeftLockedTime(chainType, hashX){
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['callScFunc', config.wanHtlcAddr, 'getHTLCLeftLockedTime',[hashX],config.HTLCWETHInstAbi,chainType], global.sendByWebSocket);
    return p;
  },
  monitorTxConfirm(chainType, txhash, waitBlocks) {
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getTransactionConfirm', txhash, waitBlocks,chainType], global.sendByWebSocket);
    return p;
  },
  getEthLockTime(chainType='ETH'){
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getScVar', config.ethHtlcAddr, 'lockedTime',config.HtlcETHAbi,chainType], global.sendByWebSocket);
    return p;
  },
  getE20LockTime(chainType='ETH'){
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getScVar', config.ethHtlcAddrE20, 'lockedTime',config.HtlcETHAbi,chainType], global.sendByWebSocket);
    return p;
  },
  getEthC2wRatio(chainType='ETH',crossChain='ETH'){
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getCoin2WanRatio',crossChain,chainType], global.sendByWebSocket);
    return p;
  },
  getEthBalance(addr,chainType='ETH') {
    let bs = pu.promisefy(global.sendByWebSocket.sendMessage, ['getBalance',addr,chainType], global.sendByWebSocket);
    return bs;
  },
  getBlockByNumber(blockNumber,chainType) {
    let bs = pu.promisefy(global.sendByWebSocket.sendMessage, ['getBlockByNumber',blockNumber,chainType], global.sendByWebSocket);
    return bs;
  },
  getWanBalance(addr,chainType='WAN') {
    let bs = pu.promisefy(global.sendByWebSocket.sendMessage, ['getBalance',addr,chainType], global.sendByWebSocket);
    return bs;
  },
  getMultiEthBalances(addrs,chainType='ETH') {
    let bs = pu.promisefy(global.sendByWebSocket.sendMessage, ['getMultiBalances',addrs,chainType], global.sendByWebSocket);
    return bs;
  },
  getMultiWanBalances(addrs,chainType='WAN') {
    let bs = pu.promisefy(global.sendByWebSocket.sendMessage, ['getMultiBalances',addrs,chainType], global.sendByWebSocket);
    return bs;
  },
  // getMultiTokenBalance(addrs,tokenType) {
  //   let bs = pu.promisefy(global.sendByWebSocket.sendMessage, ['getMultiTokenBalance',addrs,tokenType], global.sendByWebSocket);
  //   return bs;
  // },
  getMultiTokenBalanceByTokenScAddr(addrs,tokenScAddr,chainType) {
    let bs = pu.promisefy(global.sendByWebSocket.sendMessage, ['getMultiTokenBalanceByTokenScAddr',addrs,tokenScAddr,chainType], global.sendByWebSocket);
    return bs;
  },
  getRegErc20Tokens(){
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getRegErc20Tokens'], global.sendByWebSocket);
    return p;
  },
  syncErc20StoremanGroups(tokenScAddr) {
    let b = pu.promisefy(global.sendByWebSocket.sendMessage, ['syncErc20StoremanGroups',tokenScAddr], global.sendByWebSocket);
    return b;
  },
  getNonce(addr,chainType,includePendingOrNot=false) {
    let b = pu.promisefy(global.sendByWebSocket.sendMessage, ['getNonce', addr, chainType,includePendingOrNot], global.sendByWebSocket);
    return b;
  },
  getErc20Info(tokenScAddr,chainType='ETH') {
    let b = pu.promisefy(global.sendByWebSocket.sendMessage, ['getErc20Info', tokenScAddr, chainType], global.sendByWebSocket);
    return b;
  },
  getErc20SymbolInfo(tokenScAddr,chainType='ETH') {
    let b = pu.promisefy(global.sendByWebSocket.sendMessage, ['getErc20SymbolInfo', tokenScAddr, chainType], global.sendByWebSocket);
    return b;
  },
  getErc20DecimalsInfo(tokenScAddr,chainType='ETH') {
    // global.logger.debug("global.sendByWebSocket is:");
    // global.logger.debug(global.sendByWebSocket.sendMessage);
    let b = pu.promisefy(global.sendByWebSocket.sendMessage, ['getErc20DecimalsInfo', tokenScAddr, chainType], global.sendByWebSocket);
    return b;
  },
  getToken2WanRatio(tokenOrigAddr,crossChain="ETH"){
    let b = pu.promisefy(global.sendByWebSocket.sendMessage, ['getToken2WanRatio', tokenOrigAddr, crossChain], global.sendByWebSocket);
    return b;
  },
  getErc20Allowance(tokenScAddr,ownerAddr,spenderAddr,chainType='ETH'){
    let b = pu.promisefy(global.sendByWebSocket.sendMessage, ['getErc20Allowance', tokenScAddr, ownerAddr,spenderAddr,chainType], global.sendByWebSocket);
    return b;
  },
  getDataByFuncInterface(abi,contractAddr,funcName,...args){
    let Contract = web3.eth.contract(abi);
    let conInstance = Contract.at(contractAddr);
    let functionInterface =  conInstance[funcName];
    //global.logger.debug("functionInterface ", functionInterface);
    return functionInterface.getData(...args);
  },

  getPrivateKey(address, password,keystorePath) {
    let keystoreDir   = new KeystoreDir(keystorePath);
    let account       = keystoreDir.getAccount(address);
    let privateKey    = account.getPrivateKey(password);
    return privateKey;
  },
  signFunc(trans, privateKey, TxClass) {
    global.logger.debug("before singFunc: trans");
    const tx            = new TxClass(trans);
    tx.sign(privateKey);
    const serializedTx  = tx.serialize();
    return "0x" + serializedTx.toString('hex');
  },

  signEthByPrivateKey(trans, privateKey) {
    return this.signFunc(trans, privateKey, ethTx);
  },
  signWanByPrivateKey(trans, privateKey) {
    return this.signFunc(trans, privateKey, wanchainTx);
  },
  isEthAddress(address){
    let validate;
    if (/^0x[0-9a-f]{40}$/i.test(address)) {
      validate = true;
    } else if (/^0x[0-9A-F]{40}$/i.test(address)) {
      validate = true;
    } else {
      validate = ethUtil.isValidChecksumAddress(address);
    }
    return validate;
  },
  isWanAddress(address){
    let validate;
    if (/^0x[0-9a-f]{40}$/i.test(address)) {
      validate = true;
    } else if (/^0x[0-9A-F]{40}$/i.test(address)) {
      validate = true;
    } else {
      validate = wanUtil.isValidChecksumAddress(address);
    }
    return validate;
  },

  getWei(amount, exp=18){
    let amount1 = new BigNumber(amount);
    let exp1    = new BigNumber(10);
    let wei     = amount1.times(exp1.pow(exp));
    return '0x' + wei.toString(16);
  },

  getGWeiToWei(amount, exp=9){
    let amount1 = new BigNumber(amount);
    let exp1    = new BigNumber(10);
    let wei = amount1.times(exp1.pow(exp));
    return Number(wei);
  },
  getSrcChainName(){
    return global.crossInvoker.getSrcChainName();
  },
  getDstChainName(selectedSrcChainName){
    return global.crossInvoker.getDstChainName(selectedSrcChainName);
  },
  getStoremanGroupList(srcChainName,dstChainName){
    return global.crossInvoker.getStoremanGroupList(srcChainName,dstChainName);
  },
  getSrcChainNameByContractAddr(contractAddr,chainType){
    return global.crossInvoker.getSrcChainNameByContractAddr(contractAddr,chainType);
  },
  getKeyStorePaths(srcChainName,dstChainName){
    return global.crossInvoker.getKeyStorePaths(srcChainName,dstChainName);
  },
  invokeCrossChain(srcChainName, dstChainName, action,input){
    return global.crossInvoker.invoke(srcChainName, dstChainName, action,input);
  },
  waitConfirm(txHash, waitBlocks,chainType) {
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getTransactionConfirm', txHash, waitBlocks,chainType], global.sendByWebSocket);
    return p;
  },
  sendTrans(signedData,chainType){
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['sendRawTransaction', signedData, chainType], global.sendByWebSocket);
    return p;
  },

  canRefund(record){

    let lockedTime          = Number(record.lockedTime);
    let buddyLockedTime     = Number(record.buddyLockedTime);
    let status              = record.status;
    let buddyLockedTimeOut  = Number(record.buddyLockedTimeOut);


    //global.lockedTime
    if(status !== 'BuddyLocked' && status !== 'RefundSent'){
      retResult.code    = false;
      retResult.result  = "waiting buddy lock";
      return retResult;
    }
    let currentTime                 =  Number(Date.now())/1000; //unit s
    global.logger.debug("lockedTime,buddyLockedTime,status, currentTime, buddyLockedTimeOut\n");
    global.logger.debug(lockedTime,buddyLockedTime,status, currentTime, buddyLockedTimeOut);
    if(currentTime>buddyLockedTime  && currentTime<buddyLockedTimeOut){
      retResult.code    = true;
      return retResult;
    }else{
      retResult.code    = false;
      retResult.result  = "Hash lock time is not meet.";
      return retResult;
    }
  },

  canRevoke(record){

    let lockedTime          = Number(record.lockedTime);
    let buddyLockedTime     = Number(record.buddyLockedTime);
    let status              = record.status;
    let htlcTimeOut         = Number(record.htlcTimeOut);

    if(status !== 'BuddyLocked' && status !== 'Locked' && status !== 'RevokeSent'){
      retResult.code    = false;
      retResult.result  = "Can not revoke,staus is not BuddyLocked or Locked";
      return retResult;
    }
    let currentTime             =   Number(Date.now())/1000;
    global.logger.debug("lockedTime,buddyLockedTime,status, currentTime, htlcTimeOut\n");
    global.logger.debug(lockedTime,buddyLockedTime,status, currentTime, htlcTimeOut);
    if(currentTime>htlcTimeOut){
      retResult.code    = true;
      return retResult;
    }else{
      retResult.code    = false;
      retResult.result  = "Hash lock time is not meet.";
      return retResult;
    }
  }
  ,
  getKeyByBuddyContractAddr(contractAddr,chainType){
    return global.crossInvoker.getKeyByBuddyContractAddr(contractAddr,chainType);
  },
  setInitNonceTest(initNonce){
    global.nonceTest = initNonce;
  },
  getNonceTest(){
    global.nonceTest = Number(global.nonceTest)+1;
    return global.nonceTest;
  },
  getCrossInvokerConfig(srcChainName, dstChainName){
    return global.crossInvoker.getCrossInvokerConfig(srcChainName, dstChainName);
  },
  getCrossInvokerClass(crossInvokerConfig, action){
    return global.crossInvoker.getCrossInvokerClass(crossInvokerConfig, action);
  },
  getCrossChainInstance(crossInvokerClass,crossInvokerInput,crossInvokerConfig){
    return global.crossInvoker.getInvoker(crossInvokerClass,crossInvokerInput,crossInvokerConfig);
  },
  getSrcChainDic(){
    return global.crossInvoker.getSrcChainDic();
  },
  hiddenProperties(inputObj,properties){
    let retObj = {};
    Object.assign(retObj,inputObj);
    for(let propertyName of properties){
      retObj[propertyName] = '*******';
    }
    return retObj;
}
}
module.exports = ccUtil;
