'use strict'
const Web3                      = require("web3");
const WebSocket                 = require('ws');
const pu                        = require('promisefy-util');
const BigNumber                 = require('bignumber.js');
const wanUtil                   = require("wanchain-util");
const keythereum                = require("keythereum");
const crypto                    = require('crypto');
const secp256k1                 = require('secp256k1');
const createKeccakHash          = require('keccak');
keythereum.constants.quiet      = true;
const config                    = {};
const net                       = require('net');
let   web3                      = new Web3(null);
let     KeystoreDir             = require('../keystore').KeystoreDir;
let     ethTx                   = require('ethereumjs-tx');

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
    logDebug.debug('input key:', key);
    logDebug.debug('input hash key:', hashKey);
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
  /* function about account          */
  async getEthAccountsInfo() {
    let bs;
    try {
      this.ethAddrs  = Object.keys(this.EthKeyStoreDir.getAccounts());
      bs = await this.getMultiEthBalances(this.ethAddrs,'ETH');
    }
    catch(err){
      logger.error("getEthAccountsInfo", err);
      return [];
    }
    let infos = [];
    for(let i=0; i<this.ethAddrs.length; i++){
      let info = {};
      info.balance = bs[this.ethAddrs[i]];
      info.address = this.ethAddrs[i];
      infos.push(info);
    }

    logger.debug("Eth Accounts infor: ", infos);
    return infos;
  },
  async getWanAccountsInfo() {
    this.wanAddrs  = Object.keys(this.WanKeyStoreDir.getAccounts());
    let bs = await this.getMultiWanBalances(this.wanAddrs,'WAN');
    let es = await this.getMultiTokenBalance(this.wanAddrs,'WAN');
    let infos = [];
    for(let i=0; i<this.wanAddrs.length; i++){
      let info = {};
      info.address = this.wanAddrs[i];
      info.balance = bs[this.wanAddrs[i]];
      info.wethBalance = es[this.wanAddrs[i]];
      infos.push(info);
    }

    logger.debug("Wan Accounts infor: ", infos);
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
  // Event API
  getDepositOrigenLockEvent(chainType, hashX) {
    let topics = ['0x'+wanUtil.sha3(config.depositOriginLockEvent).toString('hex'), null, null, hashX];
    let b = pu.promisefy(global.sendByWebSocket.sendMessage, ['getScEvent', config.originalChainHtlc, topics,chainType], global.sendByWebSocket);
    return b;
  },
  getWithdrawOrigenLockEvent(chainType, hashX) {
    let topics = ['0x'+wanUtil.sha3(config.withdrawOriginLockEvent).toString('hex'), null, null, hashX];
    let b = pu.promisefy(global.sendByWebSocket.sendMessage, ['getScEvent', config.wanchainHtlcAddr, topics,chainType], global.sendByWebSocket);
    return b;
  },
  getWithdrawRevokeEvent(chainType, hashX) {
    let topics = ['0x'+wanUtil.sha3(config.withdrawOriginRevokeEvent).toString('hex'), null,  hashX];
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getScEvent', config.wanchainHtlcAddr, topics,chainType], global.sendByWebSocket);
    return p;
  },
  getWithdrawCrossLockEvent(chainType, hashX) {
    let topics = ['0x'+wanUtil.sha3(config.withdrawCrossLockEvent).toString('hex'), null, null, hashX];
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getScEvent', config.originalChainHtlc, topics,chainType], global.sendByWebSocket);
    return p;
  },
  getDepositCrossLockEvent(chainType, hashX) {
    let topics = ['0x'+wanUtil.sha3(config.depositCrossLockEvent).toString('hex'), null, null, hashX];
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getScEvent', config.wanchainHtlcAddr, topics,chainType], global.sendByWebSocket);
    return p;
  },
  getDepositOriginRefundEvent(chainType, hashX) {
    let topics = ['0x'+wanUtil.sha3(config.depositOriginRefundEvent).toString('hex'), null, null, hashX];
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getScEvent', config.wanchainHtlcAddr, topics,chainType], global.sendByWebSocket);
    return p;
  },
  getWithdrawOriginRefundEvent(chainType, hashX) {
    let topics = ['0x'+wanUtil.sha3(config.withdrawOriginRefundEvent).toString('hex'), null, null, hashX];
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getScEvent', config.originalChainHtlc, topics,chainType], global.sendByWebSocket);
    return p;
  },
  getDepositRevokeEvent(chainType, hashX) {
    let topics = ['0x'+wanUtil.sha3(config.depositOriginRevokeEvent).toString('hex'), null,  hashX];
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getScEvent', config.originalChainHtlc, topics,chainType], global.sendByWebSocket);
    return p;
  },
  getScEventByFunc(chainType,eventFunc,contractAdd,hashX){
    let topics = ['0x'+wanUtil.sha3(eventFunc).toString('hex'), null,  hashX];
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getScEvent', contractAdd, topics,chainType], global.sendByWebSocket);
    return p;
  },
  // Time
  getDepositHTLCLeftLockedTime(chainType, hashX){
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['callScFunc', config.originalChainHtlc, 'getHTLCLeftLockedTime',[hashX],config.HTLCETHInstAbi,chainType], global.sendByWebSocket);
    return p;
  },
  getWithdrawHTLCLeftLockedTime(chainType, hashX){
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['callScFunc', config.wanchainHtlcAddr, 'getHTLCLeftLockedTime',[hashX],config.HTLCWETHInstAbi,chainType], global.sendByWebSocket);
    return p;
  },
  monitorTxConfirm(chainType, txhash, waitBlocks) {
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getTransactionConfirm', txhash, waitBlocks,chainType], global.sendByWebSocket);
    return p;
  },
  getEthLockTime(chainType){
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getScVar', config.originalChainHtlc, 'lockedTime',config.HTLCETHInstAbi,chainType], global.sendByWebSocket);
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
  getMultiTokenBalance(addrs,chainType) {
    let bs = pu.promisefy(global.sendByWebSocket.sendMessage, ['getMultiTokenBalance',addrs,chainType], global.sendByWebSocket);
    return bs;
  },
  getMultiTokenBalanceByTokenScAddr(address,tokenScAddr,chainType) {
    let bs = pu.promisefy(global.sendByWebSocket.sendMessage, ['getMultiTokenBalance',addrs,tokenScAddr,chainType], global.sendByWebSocket);
    return bs;
  },
  getRegErc20Tokens(){
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getRegErc20Tokens'], global.sendByWebSocket);
    return p;
  },
  syncStoremanGroupsE20(addr) {
    let b = pu.promisefy(global.sendByWebSocket.sendMessage, ['syncStoremanGroupsE20',addr], global.sendByWebSocket);
    return b;
  },
  getNonce(addr,chainType) {
    // console.log("global.sendByWebSocket is:");
    // console.log(global.sendByWebSocket.sendMessage);
    let b = pu.promisefy(global.sendByWebSocket.sendMessage, ['getNonce', addr, chainType], global.sendByWebSocket);
    return b;
  },
  getDataByFuncInterface(abi,contractAddr,funcName,...args){
      let Contract = web3.eth.contract(abi);
      let conInstance = Contract.at(contractAddr);
      let functionInterface =  conInstance[funcName];
      console.log("functionInterface ", functionInterface);
      return functionInterface.getData(...args);
    },

  getPrivateKey(chainType, address, password,keystorePath) {
    let keystoreDir   = new KeystoreDir(keystorePath);
    let account       = keystoreDir.getAccount(address);
    let privateKey    = account.getPrivateKey(password);
    return privateKey;
  },
  signFunc(trans, privateKey, TxClass) {
    console.log("before singFunc: trans");
    console.log(trans);
    const tx            = new TxClass(trans);
    tx.sign(privateKey);
    const serializedTx  = tx.serialize();
    return "0x" + serializedTx.toString('hex');
  },

  signByPrivateKey(trans, privateKey) {
    return this.signFunc(trans, privateKey, ethTx);
  },
  getWei(amount, exp=18){
    let amount1 = new BigNumber(amount);
    let exp1    = new BigNumber(10);
    let wei = amount1.times(exp1.pow(exp));
    return '0x' + wei.toString(16);
  },

  getGWeiToWei(amount, exp=9){
    let amount1 = new BigNumber(amount);
    let exp1    = new BigNumber(10);
    let wei = amount1.times(exp1.pow(exp));
    return Number(wei);
  }
}
module.exports = ccUtil;
