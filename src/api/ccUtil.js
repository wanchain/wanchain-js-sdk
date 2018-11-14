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


/**
* ccUtil
 */
const ccUtil = {
  /**
   * generate private key, in sdk , it is named x
   * @function generatePrivateKey
   * @returns {string}
   */
  generatePrivateKey(){
    let randomBuf;
    do{
      randomBuf = crypto.randomBytes(32);
    }while (!secp256k1.privateKeyVerify(randomBuf));
    return '0x' + randomBuf.toString('hex');
  },
  /**
   * Build hashKey,in sdk it is named hashX
   * @function getHashKey
   * @param {string} key - result of {@link ccUtil#generatePrivateKey ccUtil#generatePrivateKey}
   * @returns {string}   - in sdk ,it is named hashX
   */
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

  /**
   * Create Eth address
   * @function createEthAddr
   * @param {string} keyPassword  - key password
   * @returns {string}            - eth address
   */
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
  /**
   * Create Wan address
   * @function createWanAddr
   * @param {string} keyPassword  - key password
   * @returns {string}            - eth address
   */
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
  /**
   * isEthAddress
   * @function isEthAddress
   * @param {string} address    - Eth address
   * @returns {boolean}
   * true: Eth address
   * false: Non Eth address
   */
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
  /**
   * isWanAddress
   * @function isWanAddress
   * @param {string} address    - Eth address
   * @returns {boolean}
   * true: Wan address
   * false: Non Wan address
   */
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

  /**
   * get all Eth accounts on local host
   * @function getEthAccounts
   * @returns {string[]}
   */
  getEthAccounts(){
    let ethAddrs = Object.keys(new KeystoreDir(config.ethKeyStorePath).getAccounts());
    return ethAddrs;
  },
  /**
   * get all Wan accounts on local host
   * @function getWanAccounts
   * @returns {string[]}
   */
  getWanAccounts(){
    let wanAddrs = Object.keys(new KeystoreDir(config.wanKeyStorePath).getAccounts());
    return wanAddrs;
  },
  /**
   * get all Eth accounts on local host
   * @function getEthAccountsInfo
   * @async
   * @returns {Promise<Array>}
   */
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
  /**
   * get all Wan accounts on local host
   * @function getWanAccountsInfo
   * @async
   * @returns {Promise<Array>}
   */
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
  async getWanAccountsInfoByWeb3() {
    try{
      let wanAddrs = this.getWanAccounts();
      let balance;
      let infos = [];
      let web3 = global.sendByWeb3.web3;
      for (let i = 0; i < wanAddrs.length; i++) {
        let info = {};
        info.address = wanAddrs[i];
        balance = await this.getWanBalanceByWeb3(wanAddrs[i]);
        info.balance = balance.toString(10);
        infos.push(info);
      }
      // logger.debug("Wan Accounts infor: ", infos);
      return infos;
    }catch(error){
      console.log("Error getWanAccountsInfoByWeb3");
    }

  },
  async getWanBalanceByWeb3(addr){
    return new Promise(function(resolve,reject){
      let web3 = global.sendByWeb3.web3;
      web3.eth.getBalance(addr,function (err,result) {
        if(err){
          reject(err);
        }else{
          resolve(result);
        }
      })
    });
  },
  /**
   * Get GWei to Wei , used for gas price.
   * @function getGWeiToWei
   * @param amount
   * @param exp
   * @returns {number}
   */
  getGWeiToWei(amount, exp=9){
    // let amount1 = new BigNumber(amount);
    // let exp1    = new BigNumber(10);
    // let wei = amount1.times(exp1.pow(exp));
    // return Number(wei);
    let wei = web3.toBigNumber(amount).times('1e' + exp).trunc();
    return Number(wei);
  },

  /**
   * weiToToken
   * @function weiToToken
   * @param {number} tokenWei
   * @param {number} decimals      - Must change 18 to the decimals for the actual decimal of token.
   * @returns {string}
   */
  weiToToken(tokenWei, decimals=18) {
    return web3.toBigNumber(tokenWei).dividedBy('1e' + decimals).toString(10);
  },
  /**
   * tokenToWei
   * @function tokenToWei
   * @param {number}token
   * @param {number} decimals
   * @returns {string}
   */
  tokenToWei(token, decimals=18) {
    let wei = web3.toBigNumber(token).times('1e' + decimals).trunc();
    return wei.toString(10);
  },
  /**
   * tokenToWeiHex
   * @function tokenToWeiHex
   * @param {number} token    - amount of token
   * @param {number} decimals - the decimals of this token
   * @returns {string}
   */
  tokenToWeiHex(token, decimals=18) {
    let wei = web3.toBigNumber(token).times('1e' + decimals).trunc();
    return '0x'+ wei.toString(16);
  },
  /**
   * get the decimal of the token
   * @function getDecimalByScAddr
   * @param {string} contractAddr - the token's contract address
   * @param {string} chainType    - enum{'ETH', 'WAN','BTC'}
   * @returns {number}
   */
  getDecimalByScAddr(contractAddr, chainType){
    let chainName = this.getSrcChainNameByContractAddr(contractAddr,chainType);
    return chainName ? chainName[1].tokenDecimals : 18;
  },
  /**
   * When users cross tokens from WAN to others chain, here called outbound</br>
   * sdk lock the return value, if users leave WAN chain, the return value </br>
   * should be cost same as gas. if users lock token on WAN, NOT redeem on </br>
   * destination chain, and revoke on WAN chain. It takes users a little part</br>
   * return value like gas to avoid malicious cross chain transaction.
   *@function calculateLocWanFee
   * @param {number} value
   * @param {number} coin2WanRatio
   * @param {number} ctxFeeRatio
   * @returns {string}
   */
  calculateLocWanFee(value,coin2WanRatio,txFeeRatio){
    let wei     = web3.toWei(web3.toBigNumber(value));
    const DEFAULT_PRECISE = 10000;
    let fee = wei.mul(coin2WanRatio).mul(txFeeRatio).div(DEFAULT_PRECISE).div(DEFAULT_PRECISE).trunc();

    return '0x'+fee.toString(16);
  },

  /**
   * get storeman groups which serve ETH  coin transaction.
   * @function getEthSmgList
   * @param chainType
   * @returns {Object}
   */
  getEthSmgList(chainType='ETH') {
    let b = pu.promisefy(global.sendByWebSocket.sendMessage, ['syncStoremanGroups',chainType], global.sendByWebSocket);
    return b;
  },
  /**
   * @function getTxReceipt
   * @param chainType
   * @param txhash
   * @returns {*}
   */
  getTxReceipt(chainType,txhash){
    let bs = pu.promisefy(global.sendByWebSocket.sendMessage, ['getTransactionReceipt',txhash,chainType], global.sendByWebSocket);
    return bs;
  },
  /**
   * @function getTxInfo
   * @param chainType
   * @param txhash
   * @returns {*}
   */
  getTxInfo(chainType,txhash){
    let bs = pu.promisefy(global.sendByWebSocket.sendMessage, ['getTxInfo',txhash,chainType], global.sendByWebSocket);
    return bs;
  },
  /**
   * Get the ration between WAN and ETH.
   * @function
   * @param chainType
   * @param crossChain
   * @returns {*}
   */
  getEthC2wRatio(chainType='ETH',crossChain='ETH'){
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getCoin2WanRatio',crossChain,chainType], global.sendByWebSocket);
    return p;
  },
  /**
   * Get ETH coin balance.
   * @function getEthBalance
   * @param addr
   * @param chainType
   * @returns {*}
   */
  getEthBalance(addr,chainType='ETH') {
    let bs = pu.promisefy(global.sendByWebSocket.sendMessage, ['getBalance',addr,chainType], global.sendByWebSocket);
    return bs;
  },
  /**
   * @function getBlockByNumber
   * @param blockNumber
   * @param chainType
   * @returns {*}
   */
  getBlockByNumber(blockNumber,chainType) {
    let bs = pu.promisefy(global.sendByWebSocket.sendMessage, ['getBlockByNumber',blockNumber,chainType], global.sendByWebSocket);
    return bs;
  },
  /**
   * Get wan coin balance of special address
   * @function getWanBalance
   * @param addr
   * @param chainType
   * @returns {*}
   */
  getWanBalance(addr,chainType='WAN') {
    let bs = pu.promisefy(global.sendByWebSocket.sendMessage, ['getBalance',addr,chainType], global.sendByWebSocket);
    return bs;
  },
  /**
   * @function getMultiEthBalances
   * @param addrs
   * @param chainType
   * @returns {*}
   */
  getMultiEthBalances(addrs,chainType='ETH') {
    let bs = pu.promisefy(global.sendByWebSocket.sendMessage, ['getMultiBalances',addrs,chainType], global.sendByWebSocket);
    return bs;
  },
  /**
   * @function getMultiWanBalances
   * @param addrs
   * @param chainType
   * @returns {*}
   */
  getMultiWanBalances(addrs,chainType='WAN') {
    let bs = pu.promisefy(global.sendByWebSocket.sendMessage, ['getMultiBalances',addrs,chainType], global.sendByWebSocket);
    return bs;
  },
  /**
   * Get token balance by contract address and users addresses.
   * @function getMultiTokenBalanceByTokenScAddr
   * @param addrs
   * @param tokenScAddr
   * @param chainType
   * @returns {*}
   */
  getMultiTokenBalanceByTokenScAddr(addrs,tokenScAddr,chainType) {
    let bs = pu.promisefy(global.sendByWebSocket.sendMessage, ['getMultiTokenBalanceByTokenScAddr',addrs,tokenScAddr,chainType], global.sendByWebSocket);
    return bs;
  },
  /**
   * Get all ERC 20 tokens from API server. The return information include token's contract address</b>
   * and the buddy contract address of the token.
   * @function getRegErc20Tokens
   * @returns {*}
   */
  getRegErc20Tokens(){
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getRegErc20Tokens'], global.sendByWebSocket);
    return p;
  },
  /**
   * Get all storemen groups which provide special token service, this token's address is tokenScAddr.
   * @function syncErc20StoremanGroups
   * @param tokenScAddr
   * @returns {*}
   */
  syncErc20StoremanGroups(tokenScAddr) {
    let b = pu.promisefy(global.sendByWebSocket.sendMessage, ['syncErc20StoremanGroups',tokenScAddr], global.sendByWebSocket);
    return b;
  },
  /**
   *
   * @function getNonce
   * @param addr
   * @param chainType
   * @param includePendingOrNot
   * @returns {*}
   */
  getNonce(addr,chainType,includePendingOrNot=true) {
    let b = pu.promisefy(global.sendByWebSocket.sendMessage, ['getNonce', addr, chainType,includePendingOrNot], global.sendByWebSocket);
    return b;
  },
  /**
   * Get ERC20 tokens symbol and decimals.
   * @function getErc20Info
   * @param tokenScAddr
   * @param chainType
   * @returns {*}
   */
  getNonceByWeb3(addr,includePendingOrNot=true){
    let web3 = global.sendByWeb3.web3;
    let nonce;
    return new Promise(function (resolve, reject) {
      if(includePendingOrNot){
        web3.eth.getTransactionCount(addr,'pending',function(err,result){
          if(!err){
            nonce = '0x' + result.toString(16);
            resolve(nonce);
          }else{
            reject(err);
          }
        })
      }else{
        web3.eth.getTransactionCount(addr,function(err,result){
          if(!err){
            nonce = '0x' + result.toString(16);
            resolve(nonce);
          }else{
            reject(err);
          }
        })
      }
    })
  },
  getErc20Info(tokenScAddr,chainType='ETH') {
    let b = pu.promisefy(global.sendByWebSocket.sendMessage, ['getErc20Info', tokenScAddr, chainType], global.sendByWebSocket);
    return b;
  },
  /**
   * getToken2WanRatio
   * @function getToken2WanRatio
   * @param tokenOrigAddr
   * @param crossChain
   * @returns {*}
   */
  getToken2WanRatio(tokenOrigAddr,crossChain="ETH"){
    let b = pu.promisefy(global.sendByWebSocket.sendMessage, ['getToken2WanRatio', tokenOrigAddr, crossChain], global.sendByWebSocket);
    return b;
  },
  /**
   * ERC standard function allowance.
   * @function getErc20Allowance
   * @param tokenScAddr
   * @param ownerAddr
   * @param spenderAddr
   * @param chainType
   * @returns {*}
   */
  getErc20Allowance(tokenScAddr,ownerAddr,spenderAddr,chainType='ETH'){
    let b = pu.promisefy(global.sendByWebSocket.sendMessage, ['getErc20Allowance', tokenScAddr, ownerAddr,spenderAddr,chainType], global.sendByWebSocket);
    return b;
  },
  /**
   * If return promise resolve, the transaction has been on the block chain.</br>
   * else it fails to put transaction on the block chain.
   * @function waitConfirm
   * @param txHash
   * @param waitBlocks
   * @param chainType
   * @returns {*}
   */
  waitConfirm(txHash, waitBlocks,chainType) {
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getTransactionConfirm', txHash, waitBlocks,chainType], global.sendByWebSocket);
    return p;
  },
  /**
   * @function sendTrans
   * @param signedData
   * @param chainType
   * @returns {*}
   */
  sendTrans(signedData,chainType){
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['sendRawTransaction', signedData, chainType], global.sendByWebSocket);
    return p;
  },
  /**
   * @function sendTransByWeb3
   * @param signedData
   * @returns {Promise<any>}
   */
  sendTransByWeb3(signedData){
    return global.sendByWeb3.sendTrans(signedData);
  },
  // Event API
  /**
   * Users lock on source chain, and wait the lock event of storeman on destination chain.</br>
   * This function is used get the event of lock of storeman.(WAN->ETH coin)
   * @function getOutStgLockEvent
   * @param chainType
   * @param hashX
   * @returns {*}
   */
  getOutStgLockEvent(chainType, hashX) {
    let topics = ['0x'+wanUtil.sha3(config.outStgLockEvent).toString('hex'), null, null, hashX];
    global.mrLogger.debug("getOutStgLockEvent topics ",topics);
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getScEvent', config.ethHtlcAddr, topics,chainType], global.sendByWebSocket);
    return p;
  },
  /**
   * Users lock on source chain, and wait the lock event of storeman on destination chain.</br>
   * This function is used get the event of lock of storeman.(ETH->WAN coin)
   * @function getInStgLockEvent
   * @param chainType
   * @param hashX
   * @returns {*}
   */
  getInStgLockEvent(chainType, hashX) {
    let topics = ['0x'+wanUtil.sha3(config.inStgLockEvent).toString('hex'), null, null, hashX];
    global.mrLogger.debug("getInStgLockEvent topics ",topics);
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getScEvent', config.wanHtlcAddr, topics,chainType], global.sendByWebSocket);
    return p;
  },
  /**
   * Users lock on source chain, and wait the lock event of storeman on destination chain.</br>
   * This function is used get the event of lock of storeman.(WAN->ETH ERC20 token)
   * @function getOutStgLockEventE20
   * @param chainType
   * @param hashX
   * @returns {*}
   */
  getOutStgLockEventE20(chainType, hashX) {
    let topics = ['0x'+wanUtil.sha3(config.outStgLockEventE20).toString('hex'), null, null, hashX,null,null];
    global.mrLogger.debug("getOutStgLockEventE20 topics ",topics);
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getScEvent', config.ethHtlcAddrE20, topics,chainType], global.sendByWebSocket);
    return p;
  },
  /**
   * Users lock on source chain, and wait the lock event of storeman on destination chain.</br>
   * This function is used get the event of lock of storeman.(ETH->WAN ERC20 token)
   * @function getInStgLockEventE20
   * @param chainType
   * @param hashX
   * @returns {*}
   */
  getInStgLockEventE20(chainType, hashX) {
    let topics = ['0x'+wanUtil.sha3(config.inStgLockEventE20).toString('hex'), null, null, hashX,null,null];
    global.mrLogger.debug("getInStgLockEventE20 topics ",topics);
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getScEvent', config.wanHtlcAddrE20, topics,chainType], global.sendByWebSocket);
    return p;
  },
  /**
   * Get HTLC locked time, unit seconds.
   * @function  getEthLockTime
   * @param chainType
   * @returns {*}
   */
  getEthLockTime(chainType='ETH'){
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getScVar', config.ethHtlcAddr, 'lockedTime',config.HtlcETHAbi,chainType], global.sendByWebSocket);
    return p;
  },
  /**
   * Get HTLC locked time, unit seconds. (ERC20)
   * @function getE20LockTime
   * @param chainType
   * @returns {*}
   */
  getE20LockTime(chainType='ETH'){
    let p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getScVar', config.ethHtlcAddrE20, 'lockedTime',config.HtlcETHAbi,chainType], global.sendByWebSocket);
    return p;
  },
  /**
   * For outbound (from WAN to other chain), when users redeem on other chain, it means that user leave WAN chain.</br>
   * It takes users {@link ccUtil#calculateLocWanFee wan} for leave chain.</br>
   * If users revoke on WAN chain, it means that users keep on WAN chain.On this scenario, it takes users part {@link
    * ccUtil#calculateLocWanFee wan} for revoke transaction. The part is related to the return ratio of this function.
   * @function getE20RevokeFeeRatio
   * @param chainType
   * @returns {*}
   */
  getE20RevokeFeeRatio(chainType='ETH'){
    let p;
    if(chainType === 'ETH'){
      p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getScVar', config.ethHtlcAddrE20, 'revokeFeeRatio',config.ethAbiE20,chainType], global.sendByWebSocket);
    }else{
        if (chainType === 'WAN'){
          p = pu.promisefy(global.sendByWebSocket.sendMessage, ['getScVar', config.wanHtlcAddrE20, 'revokeFeeRatio',config.wanAbiE20,chainType], global.sendByWebSocket);
        }else{
          return null;
        }
    }
    return p;
  },
  // Contract
  /**
   * Wrapper of stand web3 interface.
   * @function getDataByFuncInterface
   * @param abi
   * @param contractAddr
   * @param funcName
   * @param args
   * @returns {*}
   */
  getDataByFuncInterface(abi,contractAddr,funcName,...args){
    let Contract = web3.eth.contract(abi);
    let conInstance = Contract.at(contractAddr);
    let functionInterface =  conInstance[funcName];
    //global.logger.debug("functionInterface ", functionInterface);
    return functionInterface.getData(...args);
  },
  /**
   * @function getPrivateKey
   * @param address
   * @param password
   * @param keystorePath
   * @returns {*}
   */
  getPrivateKey(address, password,keystorePath) {
    let keystoreDir   = new KeystoreDir(keystorePath);
    let account       = keystoreDir.getAccount(address);
    let privateKey    = account.getPrivateKey(password);
    return privateKey;
  },
  /**
   * It is used to sign transaction.
   * @function signFunc
   * @param trans
   * @param privateKey
   * @param TxClass
   * @returns {string}
   */
  signFunc(trans, privateKey, TxClass) {
    global.logger.debug("before singFunc: trans");
    const tx            = new TxClass(trans);
    tx.sign(privateKey);
    const serializedTx  = tx.serialize();
    return "0x" + serializedTx.toString('hex');
  },
  /**
   * @function signEthByPrivateKey
   * @param trans
   * @param privateKey
   * @returns {*|string}
   */
  signEthByPrivateKey(trans, privateKey) {
    return this.signFunc(trans, privateKey, ethTx);
  },
  /**
   * @function signWanByPrivateKey
   * @param trans
   * @param privateKey
   * @returns {*|string}
   */
  signWanByPrivateKey(trans, privateKey) {
    return this.signFunc(trans, privateKey, wanchainTx);
  },
  /**
   * Common function is used to parse the log returned by smart contract.
   * @function parseLogs
   * @param logs
   * @param abi
   * @returns {*}
   */
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

  // Cross invoke
  /**
   * Get all the {@link CrossInvoker#tokenInfoMap token info} supported by system.
   * @function getSrcChainName
   * @returns {Promise<*>}
   */
  getSrcChainName(){
    return global.crossInvoker.getSrcChainName();
  },
  /**
   * Get the left {@link CrossInvoker#tokenInfoMap token info} supported by system after users select source chain.
   * @function getDstChainName
   * @param selectedSrcChainName
   * @returns {Map<string, Map<string, Object>>|Map<any, any>}
   */
  getDstChainName(selectedSrcChainName){
    return global.crossInvoker.getDstChainName(selectedSrcChainName);
  },
  /**
   * Get storeman group list for cross chain.(Source chain -> Destination chain)
   * @function getStoremanGroupList
   * @param {Object} srcChainName - {@link CrossInvoker#tokenInfoMap Token info. on source chain.}
   * @param {Object} dstChainName - {@link CrossInvoker#tokenInfoMap Token info. on destination chain.}
   * @returns {Promise<Array>}
   */
  getStoremanGroupList(srcChainName,dstChainName){
    return global.crossInvoker.getStoremanGroupList(srcChainName,dstChainName);
  },
  /**
   * Get token info. in two layers {@link CrossInvoke#tokenInfoMap MAP} data structure.
   * @function getSrcChainNameByContractAddr
   * @param contractAddr
   * @param chainType
   * @returns {Object|null}
   */
  getSrcChainNameByContractAddr(contractAddr,chainType){
    return global.crossInvoker.getSrcChainNameByContractAddr(contractAddr,chainType);
  },
  /**
   * getKeyStorePaths
   * @function getKeyStorePaths
   * @param srcChainName
   * @param dstChainName
   * @returns {Array}
   */
  getKeyStorePaths(srcChainName,dstChainName){
    return global.crossInvoker.getKeyStorePaths(srcChainName,dstChainName);
  },
  /**
   * This function is used to finish cross chain.
   * @function invokeCrossChain
   * @param srcChainName          - source {@link CrossInvoke#tokenInfoMap tokenInfo}
   * @param dstChainName          - destination {@link CrossInvoke#tokenInfoMap tokenInfo}
   * @param {string} action                - enum{APPROVE, LOCK, REDEEM, REVOKE}
   * @param {Object} input                 - users input, see {@link CrossChain#input input example}
   * @returns {Promise<*>}
   */
  invokeCrossChain(srcChainName, dstChainName, action,input){
    return global.crossInvoker.invoke(srcChainName, dstChainName, action,input);
  },
  /**
   * This function is used to check whether the record(representing one transaction) can be redeemed or not.</br>
   <pre>
   0:00		0:15(BuddyLocked)								1:15(BuddyLocked timeout)					2:15(destionation chain timeout)
   |							|																|																						|
   ------------------------------------------------------------------------------------------  destination chain

   |Not Redeem		|		Can Redeem									|	Not Redeem														|  Not Redeem
   |Not Revoke		|		Can Redeem									|	Not Revoke														|	 Can Revoke

   0:00(Locked)											1:00(Locked timeout)											2:00(source chain timeout)
   |																	|																										|
   --------------------------------------------------------------------------------------  source chain
   </pre>
   * @param {Object} record
   <pre>
   {
        "hashX": "0x33a80caf5902f11c55b91a8b385146cdecbbfc593d030b5b64f688ed3f9b8f95",
        "x": "0x5c5ddca6ddbf6c0fbc5049b89913e3c1f169ca3d13d12da4d1b58c1b5d1c3e22",
        "from": "0xf47a8bb5c9ff814d39509591281ae31c0c7c2f38",
        "to": "0x393e86756d8d4cf38493ce6881eb3a8f2966bb27",
        "storeman": "0x41623962c5d44565de623d53eb677e0f300467d2",
        "value": 0,
        "contractValue": "0x15d3ef79800",
        "lockedTime": "1540878845",
        "buddyLockedTime": "1540878909",
        "srcChainAddr": "0x00f58d6d585f84b2d7267940cede30ce2fe6eae8",
        "dstChainAddr": "WAN",
        "srcChainType": "ETH",
        "dstChainType": "WAN",
        "status": "BuddyLocked",
        "approveTxHash": "0x2731869b8e77828f6c386ad7e7eb167baeffceab0ffd0487abac2b8eaa8ab8f3",
        "lockTxHash": "0xd61a4f4c8a00613a9d4932aba79a6efa2e2414b044b173f75b464d8e276fa168",
        "redeemTxHash": "",
        "revokeTxHash": "",
        "buddyLockTxHash": "0xf1d00967401759436ece3bd987427f68e8766120f8e0db51ae75c22e55803958",
        "tokenSymbol": "ZRX",
        "tokenStand": "E20",
        "htlcTimeOut": "1541138045",
        "buddyLockedTimeOut": "1541008509"
      }
   </pre>
   * @returns {{code: boolean, result: null}|transUtil.retResult|{code, result}}
   */
  canRedeem(record){
    let retResultTemp = {};
    Object.assign(retResultTemp,retResult);

    let lockedTime          = Number(record.lockedTime);
    let buddyLockedTime     = Number(record.buddyLockedTime);
    let status              = record.status;
    let buddyLockedTimeOut  = Number(record.buddyLockedTimeOut);


    //global.lockedTime
    if(status !== 'BuddyLocked'   &&
      status !== 'RedeemSent'     &&
      status !== 'RedeemSending'  &&
      status !=='RedeemFail'){
      retResultTemp.code    = false;
      retResultTemp.result  = "waiting buddy lock";
      return retResultTemp;
    }
    let currentTime                 =  Number(Date.now())/1000; //unit s
    global.logger.debug("lockedTime,buddyLockedTime,status, currentTime, buddyLockedTimeOut\n");
    global.logger.debug(lockedTime,buddyLockedTime,status, currentTime, buddyLockedTimeOut);
    if(currentTime>buddyLockedTime  && currentTime<buddyLockedTimeOut){
      retResultTemp.code    = true;
      return retResultTemp;
    }else{
      retResultTemp.code    = false;
      retResultTemp.result  = "Hash lock time is not meet.";
      return retResultTemp;
    }
  },
  /**
   * This function is used to check whether the record(representing one transaction) can be revoked or not.</br>
   * see comments of {@link ccUtil#canRedeem canRedeem}
   * @function canRevoke
   * @param record
   * @returns {{code: boolean, result: null}|transUtil.retResult|{code, result}}
   */
  canRevoke(record){
    let retResultTemp = {};
    Object.assign(retResultTemp,retResult);
    let lockedTime          = Number(record.lockedTime);
    let buddyLockedTime     = Number(record.buddyLockedTime);
    let status              = record.status;
    let htlcTimeOut         = Number(record.htlcTimeOut);

    if(status !== 'BuddyLocked'   &&
      status !== 'Locked'         &&
      status !== 'RevokeSent'     &&
      status !== 'RevokeSending'  &&
      status !== 'RevokeFail'     &&
      status !== 'RedeemFail'     &&
      status !== 'RevokeSendFail' &&
      status !== 'RedeemSendFail'){
      retResultTemp.code    = false;
      retResultTemp.result  = "Can not revoke,staus is not BuddyLocked or Locked";
      return retResultTemp;
    }
    let currentTime             =   Number(Date.now())/1000;
    global.logger.debug("lockedTime,buddyLockedTime,status, currentTime, htlcTimeOut\n");
    global.logger.debug(lockedTime,buddyLockedTime,status, currentTime, htlcTimeOut);
    if(currentTime>htlcTimeOut){
      retResultTemp.code    = true;
      return retResultTemp;
    }else{
      retResultTemp.code    = false;
      retResultTemp.result  = "Hash lock time is not meet.";
      return retResultTemp;
    }
  },
  /** Since one contract has two addresses, one is original address, the other is buddy address(contract address on WAN)
   * @function
   * @param contractAddr
   * @param chainType
   * @returns {string}
   */
  getKeyByBuddyContractAddr(contractAddr,chainType){
    return global.crossInvoker.getKeyByBuddyContractAddr(contractAddr,chainType);
  },
  /**
   * Used to set initial nonce for Test Only.
   * @function setInitNonceTest
   * @param initNonce
   */
  setInitNonceTest(initNonce){
    global.nonceTest = initNonce;
  },
  /**
   * Get nonce based on initial nonce for Test.
   * @function getNonceTest
   * @returns {*|null|number}
   */
  getNonceTest(){
    global.nonceTest = Number(global.nonceTest)+1;
    return global.nonceTest;
  },
  /**
   *@function getCrossInvokerConfig
   * @param srcChainName          - source {@link CrossInvoke#tokenInfoMap tokenInfo}
   * @param dstChainName          - destination {@link CrossInvoke#tokenInfoMap tokenInfo}
   * @returns {*}                 - return computed config.{@link CrossChain#config example config}
   */
  getCrossInvokerConfig(srcChainName, dstChainName){
    return global.crossInvoker.getCrossInvokerConfig(srcChainName, dstChainName);
  },
  /**
   * getCrossInvokerClass
   * @function getCrossInvokerClass
   * @param crossInvokerConfig    - see {@link ccUtil#getCrossInvokerConfig crossInvokerConfig}
   * @param action                - APPROVE,LOCK, REDEEM, REVOKE
   * @returns {CrossChain|*}      - instance of class CrossChain or sub class of CrossChain.
   */
  getCrossInvokerClass(crossInvokerConfig, action){
    return global.crossInvoker.getCrossInvokerClass(crossInvokerConfig, action);
  },
  /**
   * get CrossChain instance.
   * @param crossInvokerClass       - see {@link ccUtil#getCrossInvokerClass}
   * @param crossInvokerInput       - see {@link CrossChain#input}
   * @param crossInvokerConfig      - see {@link ccUtil#getCrossInvokerConfig}
   * @returns {any|CrossChain}      - uses can call return  value's run function to finish cross chain transaction.
   */
  getCrossChainInstance(crossInvokerClass,crossInvokerInput,crossInvokerConfig){
    return global.crossInvoker.getInvoker(crossInvokerClass,crossInvokerInput,crossInvokerConfig);
  },
  /**
   * get src chain dic. for end users to select source chain.
   * @function getSrcChainDic
   * @returns {*}                 - sub collection{'ETH','BTC','WAN'}
   */
  getSrcChainDic(){
    return global.crossInvoker.getSrcChainDic();
  },
  /**
   * Override properies' value  to '*******'
   * @function hiddenProperties
   * @param inputObj
   * @param properties
   */
  hiddenProperties(inputObj,properties){
    let retObj = {};
    Object.assign(retObj,inputObj);
    for(let propertyName of properties){
      retObj[propertyName] = '*******';
    }
    return retObj;
},
  /**
   * Collection A, Collection B, return A-B.
   * @param tokensA
   * @param tokensB
   * @returns {Array}
   */
  differenceABTokens(tokensA,tokensB){
    let mapB = new Map();
    for(let token of tokensB){
      mapB.set(token.tokenOrigAddr,token);
    }
    let diffMap = new Map();
    for(let token of tokensA){
      if(mapB.has(token.tokenOrigAddr) === false){
        diffMap.set(token.tokenOrigAddr,token);
      }
    }
    let ret = [];
    for(value of diffMap.values()){
      ret.push(value);
    }
    return ret;
  }
}
module.exports = ccUtil;
