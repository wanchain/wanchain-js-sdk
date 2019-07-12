'use strict'
const WebSocket            = require('ws');
const wanUtil              = require("wanchain-util");
const ethUtil              = require("ethereumjs-util");
const ethTx                = require('ethereumjs-tx');
const wanchainTx           = wanUtil.wanchainTx;
const btcUtil              = require('./btcUtil.js');

const keythereum           = require("keythereum");
const crypto               = require('crypto');
const secp256k1            = require('secp256k1');
const createKeccakHash     = require('keccak');
keythereum.constants.quiet = true;
const net                  = require('net');
const utils                = require('../util/util');
const web3utils            = require('../util/web3util');

let   KeystoreDir          = require('../keystore').KeystoreDir;
let   errorHandle          = require('../trans/transUtil').errorHandle;
let   retResult            = require('../trans/transUtil').retResult;

// For checkWanPassword
const fs   = require('fs');
const path = require('path');

//let config = utils.getConfigSetting('sdk.config', {});
const logger = utils.getLogger('ccUtil.js');

const networkTimeout = utils.getConfigSetting("network:timeout", 300000);
/**
 * ccUtil
 */
const ccUtil = {
  /**
   * Should be used to encode plain param to topic
   *
   * @method encodeTopic
   * @param {String} type
   * @param {Object} param
   * @return {String} encoded plain param
   */
  encodeTopic(type, param) {
    return web3utils.encodeParam(type, param);
  },
  hexTrip0x(hexs) {
     if (0 == hexs.indexOf('0x')) {
         return hexs.slice(2);
     }
     return hexs;
  },

  hexAdd0x(hexs) {
     if (0 != hexs.indexOf('0x')) {
         return '0x' + hexs;
     }
     return hexs;
  },
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

    let config = utils.getConfigSetting('sdk:config', undefined);
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

    let config = utils.getConfigSetting('sdk:config', undefined);
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
    if (/^0x[0-9a-f]{40}$/.test(address)) {
      validate = true;
    } else if (/^0x[0-9A-F]{40}$/.test(address)) {
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
    let config = utils.getConfigSetting('sdk:config', undefined);
    let ethAddrs = Object.keys(new KeystoreDir(config.ethKeyStorePath).getAccounts());
    return ethAddrs;
  },
  /**
   * get all Wan accounts on local host
   * @function getWanAccounts
   * @returns {string[]}
   */
  getWanAccounts(){
    let config = utils.getConfigSetting('sdk:config', undefined);
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
    let wei = utils.toBigNumber(amount).times('1e' + exp).trunc();
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
    return utils.toBigNumber(tokenWei).dividedBy('1e' + decimals).toString(10);
  },
  /**
   * tokenToWei
   * @function tokenToWei
   * @param {number}token
   * @param {number} decimals
   * @returns {string}
   */
  tokenToWei(token, decimals=18) {
    let wei = utils.toBigNumber(token).times('1e' + decimals).trunc();
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
    let wei = utils.toBigNumber(token).times('1e' + decimals).trunc();
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
    let wei     = web3utils.toWei(utils.toBigNumber(value));

    return this.calculateLocWanFeeWei(wei, coin2WanRatio, txFeeRatio);
  },

  calculateLocWanFeeWei(value,coin2WanRatio,txFeeRatio){
    let wei     = utils.toBigNumber(value);
    const DEFAULT_PRECISE = 10000;
    let fee = wei.mul(coin2WanRatio).mul(txFeeRatio).div(DEFAULT_PRECISE).div(DEFAULT_PRECISE).trunc();

    return '0x'+fee.toString(16);
  },

  sleep(time){
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        resolve();
      }, time);
    });
  },
  async lockMutex(mutex){
    while (global.mutexNonce) {
      await this.sleep(3);
    }
    global.mutexNonce = true;
  },
  async unlockMutex(mutex){
    global.mutexNonce = false;
  },
  getNonceByLocal(addr,chainType){
    let self = this;
    return new Promise(async (resolve, reject) => {
      await self.lockMutex(global.mutexNonce);
      let retNonce;
      try {
        let noncePendingCurrent = Number(await self.getNonce(addr,chainType,true));
        let mapAccountNonce = global.mapAccountNonce;
        if(mapAccountNonce.get(chainType).has(addr)) {
          // get usedPendingNonce
          let usedPendingNonce = mapAccountNonce.get(chainType).get(addr).usedPendingNonce;
          if (noncePendingCurrent >= (Number(usedPendingNonce) + 1)) {
            let nonce = noncePendingCurrent;
            // update Map;
            mapAccountNonce.get(chainType).get(addr).usedPendingNonce = nonce;
            // clear the hole list;
            mapAccountNonce.get(chainType).get(addr).nonceHoleList.length = 0;
            retNonce = nonce;
            await self.unlockMutex(global.mutexNonce);
            resolve(retNonce);
          } else {
            let nonceHoleList = mapAccountNonce.get(chainType).get(addr).nonceHoleList;
            if (nonceHoleList.length >= 1) {
              // get nonce object.
              let nonce = nonceHoleList[0];
              // remove nonceHoleList[0];
              nonceHoleList.splice(0,1);
              retNonce = nonce;
              await self.unlockMutex(global.mutexNonce);
              resolve(retNonce);
            } else {
              let nonce = Number(usedPendingNonce) + 1;
              mapAccountNonce.get(chainType).get(addr).usedPendingNonce = nonce;
              retNonce = nonce;
              await self.unlockMutex(global.mutexNonce);
              resolve(retNonce);
            }
          }
        }else{
          let accountNonceObject = {
            key:              addr,
            usedPendingNonce: noncePendingCurrent,
            nonceHoleList:    [],
          };
          mapAccountNonce.get(chainType).set(addr, accountNonceObject);
          let nonce                           = noncePendingCurrent;
          accountNonceObject.usedPendingNonce = nonce;
          retNonce = nonce;
          await self.unlockMutex(global.mutexNonce);
          resolve(retNonce);
        }
      } catch (err) {
        await self.unlockMutex(global.mutexNonce);
        reject(err);
      }
    });
  },
  addNonceHoleToList(addr,chainType,nonce){
    let self = this;
    return new Promise(async function(resolve, reject){
      try{
        await self.lockMutex(global.mutexNonce);
        //let accountNonceObject = global.mapAccountNonce.get(chainType).get(addr);
        if(global.mapAccountNonce.get(chainType).has(addr)){
          let accountNonceObject = global.mapAccountNonce.get(chainType).get(addr);
          if(accountNonceObject.nonceHoleList.indexOf(Number(nonce)) === -1){
            accountNonceObject.nonceHoleList.push(Number(nonce));
          }
        }
        await self.unlockMutex(global.mutexNonce);
        resolve(nonce);
      }catch(err){
        await self.unlockMutex(global.mutexNonce);
        reject(err);
      }
    })
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
  /**
   * @function sendTransByWeb3
   * @param signedData
   * @returns {Promise<any>}
   */
  sendTransByWeb3(signedData){
    return global.sendByWeb3.sendTrans(signedData);
  },

  /**
   * Revoke
   */
  getOutRevokeEvent(chainType, hashX, toAddr) {
      // Outbound revoke
      let config = utils.getConfigSetting('sdk:config', undefined);
      let topic = [ccUtil.getEventHash(config.outRevokeEvent, config.HtlcWANAbi), null, hashX];
      return this.getHtlcEvent(topic, config.wanHtlcAddr, chainType);
  },

  getInRevokeEvent(chainType, hashX, toAddr) {
      let config = utils.getConfigSetting('sdk:config', undefined);
      let topic = [ccUtil.getEventHash(config.inRevokeEvent, config.HtlcETHAbi), null, hashX];
      return this.getHtlcEvent(topic, config.ethHtlcAddr, chainType);
  },

  getOutErc20RevokeEvent(chainType, hashX, toAddr) {
      let config = utils.getConfigSetting('sdk:config', undefined);
      let topic = [ccUtil.getEventHash(config.outRevokeEventE20, config.wanAbiE20), null, hashX, null];
      return this.getHtlcEvent(topic, config.wanHtlcAddrE20, chainType);
  },

  getInErc20RevokeEvent(chainType, hashX, toAddr) {
      let config = utils.getConfigSetting('sdk:config', undefined);
      let topic = [ccUtil.getEventHash(config.inRevokeEventE20, config.ethAbiE20), null, hashX, null];
      return this.getHtlcEvent(topic, config.ethHtlcAddrE20, chainType);
  },

  /**
   * Redeem
   */
  getOutRedeemEvent(chainType, hashX, toAddr) {
      let config = utils.getConfigSetting('sdk:config', undefined);
      // WETH --> ETH
      let topic = [ccUtil.getEventHash(config.outRedeemEvent, config.HtlcETHAbi), null, null, hashX, null];
      return this.getHtlcEvent(topic, config.ethHtlcAddr, chainType);
  },

  getInRedeemEvent(chainType, hashX, toAddr) {
      let config = utils.getConfigSetting('sdk:config', undefined);
      // ETH --> WETH
      let topic = [ccUtil.getEventHash(config.inRedeemEvent, config.HtlcWANAbi), null, null, hashX, null];
      return this.getHtlcEvent(topic, config.wanHtlcAddr, chainType);
  },

  getOutErc20RedeemEvent(chainType, hashX, toAddr) {
      let config = utils.getConfigSetting('sdk:config', undefined);
      // WERC20 --> ERC20
      let topic = [ccUtil.getEventHash(config.outRedeemEventE20, config.ethAbiE20), null, null, hashX, null];
      return this.getHtlcEvent(topic, config.ethHtlcAddrE20, chainType);
  },

  getInErc20RedeemEvent(chainType, hashX, toAddr) {
      let config = utils.getConfigSetting('sdk:config', undefined);
      // ERC20 --> WERC20
      let topic = [ccUtil.getEventHash(config.inRedeemEventE20, config.wanAbiE20), null, null, hashX, null, null];
      return this.getHtlcEvent(topic, config.wanHtlcAddrE20, chainType);
  },

  /**
   * ---------------------------------------------------------------------------
   * BTC APIs
   * ---------------------------------------------------------------------------
   */


  /**
   * Filter btc addresses by amount, return the addresses with sufficient amount.
   * @param addressList All the btc addresses.
   * @param amount The amount to fit.
   */
  async filterBtcAddressByAmount(addressList, amount) {
      let addressWithBalance = [];
      let config = utils.getConfigSetting('sdk:config', undefined);
      for (let i = 0; i < addressList.length; i++) {
          let utxos = await this.getBtcUtxo(config.MIN_CONFIRM_BLKS, config.MAX_CONFIRM_BLKS, [addressList[i].address]);

          let result = await this.getUTXOSBalance(utxos);

          addressWithBalance.push({
              'address': addressList[i].address,
              'balance': Number(utils.toBigNumber(result).div(100000000).toString())
          });
      }

      addressWithBalance = addressWithBalance.sort((a, b) => {
          return b.balance - a.balance;
      });

      let addressListReturn = [];
      let totalBalance = 0;
      for (let i = 0; i < addressWithBalance.length; i++) {
          totalBalance += addressWithBalance[i].balance;
          addressListReturn.push(addressWithBalance[i].address);

          if (totalBalance > Number(amount)) {
              break;
          }
      }

      return addressListReturn;
  },

  /**
   */
  getUTXOSBalance(utxos) {
      let sum = 0
      let i = 0
      for (i = 0; i < utxos.length; i++) {
          sum += utxos[i].value
      }
      return sum
  },

  /**
   */
  async getBtcUtxo(minconf, maxconf, addresses) {
      let utxos = await this._getBtcUtxo(minconf, maxconf, addresses);
      let utxos2 = utxos.map(function (item, index) {
          let av = item.value ? item.value : item.amount;
          item.value = Number(utils.toBigNumber(av).mul(100000000));
          item.amount = item.value;
          return item;
      });
      return utxos2;
  },

  btcGetTxSize(vin, vout) {
      return vin * 180 + vout * 34 + 10 + vin;
  },

  keysort(key, sortType) {
      // TODO: this keysort doesn't work as expect, should change it some how
      return function (a, b) {
          return sortType ? ~~(a[key] < b[key]) : ~~(a[key] > b[key])
      }
  },

  btcCoinSelect(utxos, value, feeRate, minConfParam) {
      let ninputs = 0;
      let availableSat = 0;
      let inputs = [];
      let outputs = [];
      let fee = 0;

      let minConfirm = 0;
      if (minConfParam) {
          minConfirm = minConfParam;
      }

      utxos = utxos.sort(this.keysort('value', true));

      for (let i = 0; i < utxos.length; i++) {
          const utxo = utxos[i]
          if (utxo.confirmations >= minConfirm) {
              availableSat += Math.round(utxo.value)
              ninputs++
              inputs.push(utxo)
              fee = this.btcGetTxSize(ninputs, 2) * feeRate
              if (availableSat >= value + fee) {
                  break
              }
          }
      }

      fee = this.btcGetTxSize(ninputs, 2) * feeRate
      let change = availableSat - value - fee

      if (change < 0) {
          throw(new Error('balance can not offord fee and target tranfer value'));
      }

      return {inputs, change, fee}
  },

  /**
   */
  async btcBuildTransaction(utxos, keyPairArray, target, feeRate) {
      let addressArray = [];
      let addressKeyMap = {};

      let i;
      for (i = 0; i < keyPairArray.length; i++) {
          let kp = keyPairArray[i];
          let address = btcUtil.getAddressbyKeypair(kp);
          addressArray.push(address);
          addressKeyMap[address] = kp;
      }

      let balance = this.getUTXOSBalance(utxos);
      if (balance <= target.value) {
          throw(new Error('utxo balance is not enough'));
      }

      let {inputs, outputs, fee} = this.btcCoinSelect(utxos, target, feeRate);

      // .inputs and .outputs will be undefined if no solution was found
      if (!inputs || !outputs) {
          throw(new Error('utxo balance is not enough'));
      }

      logger.debug('fee', fee);

      let config = utils.getConfigSetting('sdk:config', undefined);
      let txb = new bitcoin.TransactionBuilder(config.bitcoinNetwork);

      for (i = 0; i < inputs.length; i++) {
          let inItem = inputs[i];
          txb.addInput(inItem.txid, inItem.vout);
      }

      // put out at 0 position
      for (i = 0; i < outputs.length; i++) {
          let outItem = outputs[i];
          if (!outItem.address) {
              txb.addOutput(addressArray[0], Math.round(outItem.value));
          } else {
              txb.addOutput(outItem.address, Math.round(outItem.value));
          }
      }
      let rawTx;
      for (i = 0; i < inputs.length; i++) {
          let inItem = inputs[i];
          let from = inItem.address;
          let signer = addressKeyMap[from];
          txb.sign(i, signer);
      }
      rawTx = txb.build().toHex()
      logger.debug('rawTx: ', rawTx)

      return {rawTx: rawTx, fee: fee};
  },

  getBtcWanTxHistory(option) {
      // NOTICE: BTC normal tx and cross tx use same collection !!
      let config = utils.getConfigSetting('sdk:config', undefined);
      let collection = config.crossCollectionBtc;
      return global.wanDb.getItemAll(collection, option);
  },

  insertNormalTx(tx, status='Sent', source="external", satellite={}) {
      if (typeof tx !== 'object') {
          throw new error.InvalidParameter("Insert normal transaction got invalid tx!");
      }

      let collection = utils.getConfigSetting('sdk:config:normalCollection', 'normalTrans');

      if (!tx.hasOwnProperty('hashX')) {
          let x = this.generatePrivateKey();
          tx.hashX = this.getHashKey(x);
      }

      let now = parseInt(Number(Date.now())/1000).toString();
      let record = {
          "hashX"       : tx.hashX,
          "txHash"      : tx.txHash,
          "from"        : tx.from,
          "to"          : tx.to,
          "value"       : tx.value,
          "gasPrice"    : tx.gasPrice,
          "gasLimit"    : tx.gasLimit,
          "nonce"       : tx.nonce,
          "sendTime"    : tx.sendTime || now,
          "sentTime"    : tx.sentTime || now,
          "successTime" : "",
          "chainAddr"   : tx.srcSCAddrKey,
          "chainType"   : tx.srcChainType,
          "tokenSymbol" : tx.tokenSymbol,
          "status"      : status,
          "source" : source
      }

      Object.assign(record, satellite);

      global.wanDb.insertItem(collection, record);
  },

  getEventHash(eventName, contractAbi) {
      return '0x' + wanUtil.sha3(this.getcommandString(eventName, contractAbi)).toString('hex');
  },

  getcommandString(funcName, contractAbi) {
      for (var i = 0; i < contractAbi.length; ++i) {
          let item = contractAbi[i];
          if (item.name == funcName) {
              let command = funcName + '(';
              for (var j = 0; j < item.inputs.length; ++j) {
                  if (j != 0) {
                      command = command + ',';
                  }
                  command = command + item.inputs[j].type;
              }
              command = command + ')';
              return command;
          }
      }
  },

    checkWanPassword(address, keyPassword) {
        if (address.indexOf('0x') == 0) {
            address = address.slice(2);
        }
        address = address.toLowerCase();
        let filepath = this.getKsfullnamebyAddr(address);
        if (!filepath) {
            return false;
        }

        let keystoreStr = fs.readFileSync(filepath, "utf8");
        let keystore = JSON.parse(keystoreStr);
        let keyBObj = { version: keystore.version, crypto: keystore.crypto2 };

        try {
            keythereum.recover(keyPassword, keyBObj);
            return true;
        } catch (error) {
            return false;
        }
    },

    // addr has no '0x' already.
    getKsfullnamebyAddr(addr) {
        let config = utils.getConfigSetting('sdk:config', undefined);
        let addrl = addr.toLowerCase();
        let keystorePath = config.wanKeyStorePath;
        let files = fs.readdirSync(keystorePath);
        let i = 0;
        for (i = 0; i < files.length; i++) {
            if (files[i].toLowerCase().indexOf(addrl) != -1) {
                break;
            }
        }
        if (i == files.length) {
            return "";
        }
        return path.join(keystorePath, files[i]);
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
    return web3utils.getDataByFuncInterface(abi, contractAddr, funcName, ...args);
  },

  /**
   * @function getPrivateKey
   * @param address
   * @param password
   * @param keystorePath
   * @returns {*}
   */
  getPrivateKey(address, password, keystorePath) {
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
    logger.debug("before singFunc: trans");
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

  parseLogs(logs, abi) {
    if (logs === null || !Array.isArray(logs)) {
      return logs;
    }
    let evts = abi.filter(function (json) {
      return json.type === 'event';
    });
    return logs.map(function (log) {
      let e = evts.find(function(evt) {
        return (web3utils.signFunction(evt) === log.topics[0].replace("0x",""));
      });
      if (e) {
        return web3utils.decodeEventLog(e, log);
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

    async scanOTA(wid, path, password) {
        return global.OTAbackend.startScan(wid, path, password);
    },
  /**
   * This function is used to check whether the record(representing one transaction) can be redeemed or not.</br>
   <pre>
   0:00     0:15(BuddyLocked)                               1:15(BuddyLocked timeout)                   2:15(destionation chain timeout)
   |                            |                                                               |                                                                                       |
   ------------------------------------------------------------------------------------------  destination chain

   |Not Redeem      |       Can Redeem                                  |   Not Redeem                                                      |  Not Redeem
   |Not Revoke      |       Can Redeem                                  |   Not Revoke                                                      |    Can Revoke

   0:00(Locked)                                         1:00(Locked timeout)                                            2:00(source chain timeout)
   |                                                                    |                                                                                                       |
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
    logger.debug("lockedTime,buddyLockedTime,status, currentTime, buddyLockedTimeOut\n");
    logger.debug(lockedTime,buddyLockedTime,status, currentTime, buddyLockedTimeOut);
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
      status !== 'RedeemSending'  &&
      status !== 'RedeemSent'     &&
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
    logger.debug("lockedTime,buddyLockedTime,status, currentTime, htlcTimeOut\n");
    logger.debug(lockedTime,buddyLockedTime,status, currentTime, htlcTimeOut);
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
   * Override properies' value  to '*******'
   * @function hiddenProperties
   * @param inputObj
   * @param properties
   */
  hiddenProperties2(inputObj, properties){
    let retObj = {};
    Object.assign(retObj,inputObj);
    for(let propertyName of properties){
       if (retObj.hasOwnProperty(propertyName)) {
           retObj[propertyName] = '*******';
       }
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
  },

    /**
     * ========================================================================
     * RPC communication - iWAN
     * ========================================================================
     */

    /**
     * get storeman groups which serve ETH  coin transaction.
     */
    getEthSmgList() {
        return this.getSmgList('ETH');
    },

    getBtcSmgList() {
        return this.getSmgList('BTC');
    },

    getEthC2wRatio(){
        return this.getC2WRatio('ETH');
    },

    getBtcC2wRatio() {
        return this.getC2WRatio('BTC');
    },

    /**
     * Get ETH coin balance.
     */
    getEthBalance(addr) {
        return this.getBalance(addr, 'ETH');
    },

    getWanBalance(addr) {
        return this.getBalance(addr, 'WAN');
    },

    getMultiEthBalances(addrs) {
        return this.getMultiBalances(addrs, 'ETH');
    },

    getMultiWanBalances(addrs) {
        return this.getMultiBalances(addrs, 'WAN');
    },

    getSmgList(chainType) {
      return global.iWAN.call('getStoremanGroups', networkTimeout, [chainType]);
    },

    /**
     * @function getTxReceipt
     * @param chainType
     * @param txhash
     * @returns {*}
     */
    getTxReceipt(chainType, txhash){
        return global.iWAN.call('getTransactionReceipt', networkTimeout, [chainType, txhash]);
    },

    /**
     * @function getTxInfo
     * @param chainType
     * @param txhash
     * @returns {*}
     */
    getTxInfo(chainType, txhash, format){
        format = format || true;
        return global.iWAN.call('getTxInfo', networkTimeout, [chainType, txhash, format]);
    },

    /**
     * Get the ration between WAN and crosschain.
     * @function
     * @param crossChain
     * @returns {*}
     */
    getC2WRatio(crossChain='ETH'){
        return global.iWAN.call('getCoin2WanRatio', networkTimeout, [crossChain]);
    },

    /**
     * Get coin balance.
     * @function getEthBalance
     * @param addr
     * @param chainType
     * @returns {*}
     */
    getBalance(addr, chainType) {
        return global.iWAN.call('getBalance', networkTimeout, [chainType, addr]);
    },

    /**
     * @function getMultiEthBalances
     * @param addrs
     * @param chainType
     * @returns {*}
     */
    getMultiBalances(addrs,chainType) {
        return global.iWAN.call('getMultiBalances', networkTimeout, [chainType, addrs]);
    },

    /**
     * @function getBlockByNumber
     * @param blockNumber
     * @param chainType
     * @returns {*}
     */
    getBlockByNumber(blockNumber,chainType) {
        return global.iWAN.call('getBlockByNumber', networkTimeout, [chainType, blockNumber]);
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
        return global.iWAN.call('getMultiTokenBalanceByTokenScAddr', networkTimeout, [chainType, addrs, tokenScAddr]);
    },

    /**
     * Get all ERC 20 tokens from API server. The return information include token's contract address</b>
     * and the buddy contract address of the token.
     * @function getRegErc20Tokens
     * @returns {*}
     */
    getRegErc20Tokens(){
        return global.iWAN.call('getRegTokens', networkTimeout, ['ETH']);
    },

    /**
     * Get all storemen groups which provide special token service, this token's address is tokenScAddr.
     * @function syncErc20StoremanGroups
     * @param tokenScAddr
     * @returns {*}
     */
    syncErc20StoremanGroups(tokenScAddr) {
        return global.iWAN.call('getTokenStoremanGroups', networkTimeout, ['ETH', tokenScAddr]);
    },

    /**
     * @function getNonce
     * @param addr
     * @param chainType
     * @param includePendingOrNot
     * @returns {*}
     */
    getNonce(addr,chainType,includePending=true) {
        if (includePending) {
            return global.iWAN.call('getNonceIncludePending', networkTimeout, [chainType, addr]);
        } else {
            return global.iWAN.call('getNonce', networkTimeout, [chainType, addr]);
        }
    },

    getErc20Info(tokenScAddr,chainType='ETH') {
        return global.iWAN.call('getTokenInfo', networkTimeout, [chainType, tokenScAddr]);
    },

    /**
     * getToken2WanRatio
     * @function getToken2WanRatio
     * @param tokenOrigAddr
     * @param crossChain
     * @returns {*}
     */
    getToken2WanRatio(tokenOrigAddr,crossChain="ETH"){
        return global.iWAN.call('getToken2WanRatio', networkTimeout, [crossChain, tokenScAddr]);
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
        return global.iWAN.call('getTokenAllowance', networkTimeout, [chainType, tokenScAddr, ownerAddr, spenderAddr]);
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
    waitConfirm(txHash, waitBlocks, chainType) {
        return global.iWAN.call('getTransactionConfirm', networkTimeout, [chainType, waitBlocks, txHash]);
    },

    /**
     * @function sendTrans
     * @param signedData
     * @param chainType
     * @returns {*}
     */
    sendTrans(signedData, chainType){
        return global.iWAN.call('sendRawTransaction', networkTimeout, [chainType, signedData]);
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
    getOutStgLockEvent(chainType, hashX,toAddress) {
        let config = utils.getConfigSetting('sdk:config', undefined);
        let topics = ['0x'+wanUtil.sha3(config.outStgLockEvent).toString('hex'), null, toAddress, hashX];
        return global.iWAN.call('getScEvent', networkTimeout, [chainType, config.ethHtlcAddr, topics]);
    },

    /**
     * Users lock on source chain, and wait the lock event of storeman on destination chain.</br>
     * This function is used get the event of lock of storeman.(ETH->WAN coin)
     * @function getInStgLockEvent
     * @param chainType
     * @param hashX
     * @returns {*}
     */
    getInStgLockEvent(chainType, hashX,toAddress) {
        let config = utils.getConfigSetting('sdk:config', undefined);
        let topics = ['0x'+wanUtil.sha3(config.inStgLockEvent).toString('hex'), null, toAddress, hashX];
        return global.iWAN.call('getScEvent', networkTimeout, [chainType, config.wanHtlcAddr, topics]);
    },

    /**
     * Users lock on source chain, and wait the lock event of storeman on destination chain.</br>
     * This function is used get the event of lock of storeman.(WAN->ETH ERC20 token)
     * @function getOutStgLockEventE20
     * @param chainType
     * @param hashX
     * @returns {*}
     */
    getOutStgLockEventE20(chainType, hashX,toAddress) {
        let config = utils.getConfigSetting('sdk:config', undefined);
        let topics = ['0x'+wanUtil.sha3(config.outStgLockEventE20).toString('hex'), null, toAddress, hashX];
        return global.iWAN.call('getScEvent', networkTimeout, [chainType, config.ethHtlcAddrE20, topics]);
    },

    /**
     * Users lock on source chain, and wait the lock event of storeman on destination chain.</br>
     * This function is used get the event of lock of storeman.(ETH->WAN ERC20 token)
     * @function getInStgLockEventE20
     * @param chainType
     * @param hashX
     * @returns {*}
     */
    getInStgLockEventE20(chainType, hashX,toAddress) {
        let config = utils.getConfigSetting('sdk:config', undefined);
        let topics = ['0x'+wanUtil.sha3(config.inStgLockEventE20).toString('hex'), null, toAddress, hashX,null,null];
        return global.iWAN.call('getScEvent', networkTimeout, [chainType, config.wanHtlcAddrE20, topics]);
    },

    getDepositCrossLockEvent(hashX, walletAddr, chainType) {
        let config = utils.getConfigSetting('sdk:config', undefined);
        let topics = [this.getEventHash(config.depositBtcCrossLockEvent, config.HTLCWBTCInstAbi), null, walletAddr, hashX];
        return global.iWAN.call('getScEvent', networkTimeout, [chainType, config.wanchainHtlcAddr, topics]);
    },
    getBtcWithdrawStoremanNoticeEvent(hashX, walletAddr, chainType) {
        let config = utils.getConfigSetting('sdk:config', undefined);
        let topics = [this.getEventHash(config.withdrawBtcCrossLockEvent, config.HTLCWBTCInstAbi), null, walletAddr, hashX];
        return global.iWAN.call('getScEvent', networkTimeout, [chainType, config.wanchainHtlcAddr, topics]);
    },
    /**
     * Get event for topic on address of chainType
     */
    async getHtlcEvent(topic, htlcAddr, chainType) {
        return global.iWAN.call('getScEvent', networkTimeout, [chainType, htlcAddr, topic]);
    },

    /**
     * Get HTLC locked time, unit seconds.
     * @function  getEthLockTime
     * @param chainType
     * @returns {*}
     */
    getEthLockTime(chainType='ETH'){
        let config = utils.getConfigSetting('sdk:config', undefined);
        return global.iWAN.call('getScVar', networkTimeout, [chainType, config.ethHtlcAddr, 'lockedTime', config.HtlcETHAbi]);
    },

    /**
     * Get HTLC locked time, unit seconds. (ERC20)
     * @function getE20LockTime
     * @param chainType
     * @returns {*}
     */
    getE20LockTime(chainType='ETH'){
        let config = utils.getConfigSetting('sdk:config', undefined);
        return global.iWAN.call('getScVar', networkTimeout, [chainType, config.ethHtlcAddrE20, 'lockedTime', config.HtlcETHAbi]);
    },

    /**
     * Get HTLC locked time, unit seconds.
     * @function  getWanLockTime, for HTLC lock time of BTC
     * @param chainType
     * @returns {*}
     */
    getWanLockTime(chainType='WAN'){
        let config = utils.getConfigSetting('sdk:config', undefined);
        return global.iWAN.call('getScVar', networkTimeout, [chainType, config.wanHtlcAddrBtc, 'lockedTime', config.wanAbiBtc]);
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
      let config = utils.getConfigSetting('sdk:config', undefined);
      if(chainType === 'ETH'){
          p = global.iWAN.call('getScVar', networkTimeout, [chainType, config.ethHtlcAddrE20, 'revokeFeeRatio', config.ethAbiE20]);
      }else{
          if (chainType === 'WAN'){
              p = global.iWAN.call('getScVar', networkTimeout, [chainType, config.wanHtlcAddrE20, 'revokeFeeRatio', config.wanAbiE20]);
          }else{
              return null;
          }
      }
      return p;
    },

    _getBtcUtxo(minconf, maxconf, addresses) {
        return global.iWAN.call('getUTXO', networkTimeout, ['BTC', minconf, maxconf, addresses]);
    },

    /**
     */
    btcImportAddress(address) {
        return global.iWAN.call('importAddress', networkTimeout, ['BTC',address]);
    },

    getBtcTransaction(txhash) {
        return this.getTxInfo('BTC', txhash);
    },

    getBlockNumber(chain) {
        return global.iWAN.call('getBlockNumber', networkTimeout, [chain]);
    },

    getOTAMixSet(otaAddr, number, timeout) {
        return global.iWAN.call('getOTAMixSet', timeout || networkTimeout, [otaAddr, number]);
    },

    getTransByAddressBetweenBlocks(chain, addr, start, end, timeout) {
        return global.iWAN.call('getTransByAddressBetweenBlocks', timeout || networkTimeout, [chain, addr, start, end]);
    },

    getTransByBlock(chain, blockNo) {
        return global.iWAN.call('getTransByBlock', networkTimeout, [chain, blockNo]);
    },


    getGasPrice(chain)  {
        return global.iWAN.call('getGasPrice', networkTimeout, [chain]);
    },

    estimateGas(chain, txobj)  {
        return global.iWAN.call('estimateGas', networkTimeout, [chain, txobj]);
    },

    /**
     * Get iWAN instance
     */
    getIWanInstance(chain)  {
        return global.iWAN.getClientInstance();
    },

    //POS
    getEpochID(chain) {
      return global.iWAN.call('getEpochID', networkTimeout, [chain]);
    },

    getSlotID(chain) {
      return global.iWAN.call('getSlotID', networkTimeout, [chain]);
    },

    getEpochLeadersByEpochID(chain, epochID) {
      return global.iWAN.call('getEpochLeadersByEpochID', networkTimeout, [chain, epochID]);
    },

    getRandomProposersByEpochID(chain, epochID) {
      return global.iWAN.call('getRandomProposersByEpochID', networkTimeout, [chain, epochID]);
    },

    getStakerInfo(chain, blockNumber) {
      return global.iWAN.call('getStakerInfo', networkTimeout, [chain, blockNumber]);
    },

    getEpochIncentivePayDetail(chain, epochID) {
      return global.iWAN.call('getEpochIncentivePayDetail', networkTimeout, [chain, epochID]);
    },

    getActivity(chain, epochID) {
      return global.iWAN.call('getActivity', networkTimeout, [chain, epochID]);
    },

    getMaxStableBlkNumber(chain) {
      return global.iWAN.call('getMaxStableBlkNumber', networkTimeout, [chain]);
    },

    getRandom(chain, epochID, blockNumber = -1) {
      return global.iWAN.call('getRandom', networkTimeout, [chain, epochID, blockNumber]);
    },

    getValidatorInfo(chain, address) {
      return global.iWAN.call('getValidatorInfo', networkTimeout, [chain, address]);
    },

    getValidatorStakeInfo(chain, address) {
      return global.iWAN.call('getValidatorStakeInfo', networkTimeout, [chain, address]);
    },

    getValidatorTotalIncentive(chain, address, options) {
      return global.iWAN.call('getValidatorTotalIncentive', networkTimeout, [chain, address, options]);
    },

    getDelegatorStakeInfo(chain, address) {
      return global.iWAN.call('getDelegatorStakeInfo', networkTimeout, [chain, address]);
    },

    getDelegatorIncentive(chain, address, options) {
      return global.iWAN.call('getDelegatorIncentive', networkTimeout, [chain, address, options]);
    },

    getLeaderGroupByEpochID(chain, epochID) {
      return global.iWAN.call('getLeaderGroupByEpochID', networkTimeout, [chain, epochID]);
    },

    getCurrentEpochInfo(chain) {
      return global.iWAN.call('getCurrentEpochInfo', networkTimeout, [chain]);
    },

    getSlotCount(chain) {
      return global.iWAN.call('getSlotCount', networkTimeout, [chain]);
    },

    getSlotTime(chain) {
      return global.iWAN.call('getSlotTime', networkTimeout, [chain]);
    },

    getTimeByEpochID(chain, epochID) {
      return global.iWAN.call('getTimeByEpochID', networkTimeout, [chain, epochID]);
    },

    getEpochIDByTime(chain, time) {
      return global.iWAN.call('getEpochIDByTime', networkTimeout, [chain, time]);
    },

    getRegisteredValidator(address, after) {
      return global.iWAN.call('getRegisteredValidator', networkTimeout, [address, after]);
    },

    getPosInfo(chain) {
      return global.iWAN.call('getPosInfo', networkTimeout, [chain]);
    },

    getDelegatorTotalIncentive(chain, address, options) {
      return global.iWAN.call('getDelegatorTotalIncentive', networkTimeout, [chain, address, options]);
    },

    getCurrentStakerInfo(chain) {
      return global.iWAN.call('getCurrentStakerInfo', networkTimeout, [chain]);
    },

    getMaxBlockNumber(chain, epochID) {
      return global.iWAN.call('getMaxBlockNumber', networkTimeout, [chain, epochID]);
    },

    getEpochIncentiveBlockNumber(chain, epochID) {
      return global.iWAN.call('getEpochIncentiveBlockNumber', networkTimeout, [chain, epochID]);
    },

    getEpochStakeOut(chain, epochID) {
      return global.iWAN.call('getEpochStakeOut', networkTimeout, [chain, epochID]);
    },

    /**
     * ========================================================================
     * Private transaction
     * ========================================================================
     */
    getOtaFunds(wid, path, excludeRefund) {
        if (typeof wid !== 'number' || typeof path !== 'string') {
            throw error.InvalidParameter("Invalid paramter wid and/or path");
        }

        excludeRefund = excludeRefund || true;

        let myAddr = utils.compositeWalletKey(wid, path);

        let f = function(r) {
            if (r.toAcctID == myAddr) {
                if (excludeRefund && r.state === 'Refund') {
                    return false;
                }
                return true;
            }
            return false;
        }

        let otaTbl = global.wanScanDB.getUsrOTATable();
        return otaTbl.filter(f);

    },

    /* set pubkey, w, q */
    generatePubkeyIWQforRing(Pubs, I, w, q){
        let length = Pubs.length;
        let sPubs  = [];
        for(let i=0; i<length; i++){
            sPubs.push(Pubs[i].toString('hex'));
        }
        let ssPubs = sPubs.join('&');
        let ssI = I.toString('hex');
        let sw  = [];
        for(let i=0; i<length; i++){
            sw.push('0x'+w[i].toString('hex').replace(/(^0*)/g,""));
        }
        let ssw = sw.join('&');
        let sq  = [];
        for(let i=0; i<length; i++){
            sq.push('0x'+q[i].toString('hex').replace(/(^0*)/g,""));
        }
        let ssq = sq.join('&');

        let KWQ = [ssPubs,ssI,ssw,ssq].join('+');
        return KWQ;
    }

}
module.exports = ccUtil;
