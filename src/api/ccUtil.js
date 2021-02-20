'use strict'
const WebSocket = require('ws');
const wanUtil = require("wanchain-util");
const ethUtil = require("ethereumjs-util");
const ethTx = require('ethereumjs-tx');
const wanchainTx = wanUtil.wanchainTx;
const btcUtil = require('./btcUtil.js');
const hdUtil = require('./hdUtil.js');

const keythereum = require("keythereum");
const crypto = require('crypto');
const secp256k1 = require('secp256k1');
const createKeccakHash = require('keccak');
const RippleAPI = require('ripple-lib').RippleAPI;
const rippleApi = require('ripple-address-codec');

keythereum.constants.quiet = true;
const net = require('net');
const utils = require('../util/util');
const web3utils = require('../util/web3util');
const Web3 = require('web3');
const crossChainAccount = require('../util/encrypt/crossAccountEncrypt');

let KeystoreDir = require('../keystore').KeystoreDir;
let errorHandle = require('../trans/transUtil').errorHandle;
let retResult = require('../trans/transUtil').retResult;

const { Decimal } = require("decimal.js");
const Eos = require('eosjs');
const ecc = require('eosjs-ecc');
const wif = require("wif");
const floatRegex = /[^\d.-]/g
function toFloat(str) { return parseFloat(str.replace(floatRegex, '')); }
// For checkWanPassword
const fs = require('fs');
const path = require('path');

//let config = utils.getConfigSetting('sdk.config', {});
const logger = utils.getLogger('ccUtil.js');

const networkTimeout = utils.getConfigSetting("network:timeout", 300000);
/**
 * ccUtil
 */
const ccUtil = {

  /**
   * ---------------------------------------------------------------------------
   * encode/decode chain account with encrypt, the id can refer to slip-0044
   * ---------------------------------------------------------------------------
   */
  decodeAccount(chain, account) {
    let crossAccount = new crossChainAccount(chain.toLowerCase());
    return crossAccount.decodeAccount(account).account;
  },

  encodeAccount(chain, account) {
    let crossAccount = new crossChainAccount(chain.toLowerCase());
    return crossAccount.encodeAccount(account);
  },

  /**
   * ---------------------------------------------------------------------------
   * Transaction utility
   * ---------------------------------------------------------------------------
   */
  deserializeWanTx(data) {
    let tx = new wanUtil.wanchainTx(data);
    return tx.toJSON(true);
  },

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
  generatePrivateKey() {
    let randomBuf;
    do {
      randomBuf = crypto.randomBytes(32);
    } while (!secp256k1.privateKeyVerify(randomBuf));
    return '0x' + randomBuf.toString('hex');
  },
  /**
   * Build hashKey,in sdk it is named hashX
   * @function getHashKey
   * @param {string} key - result of {@link ccUtil#generatePrivateKey ccUtil#generatePrivateKey}
   * @returns {string}   - in sdk ,it is named hashX
   */
  getHashKey(key) {
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

  getSha256HashKey(key) {
    let kBuf = new Buffer(key.slice(2), 'hex');
    let h = crypto.createHash("sha256");
    h.update(kBuf);
    let hashKey = '0x' + h.digest('hex');
    return hashKey;
  },
  /**
   * Create Eth address
   * @function createEthAddr
   * @param {string} keyPassword  - key password
   * @returns {string}            - eth address
   */
  createEthAddr(keyPassword) {
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
    keythereum.exportToFile(keyObject, config.ethKeyStorePath);
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

  createPrivateKey() {
    let params = { keyBytes: 32, ivBytes: 16 };
    let dk = keythereum.create(params);
    return dk.privateKey;
  },

  /**
   * Create EOS randomKey
   * @function createEosKey
   * @returns {string}            - eos private key
   */
  async createEosKey() {
    return await ecc.randomKey();
  },

  /**
  * getEosPubKey
  * @function getEosPubKey
  * @param {string} key    - Eos private key
  * @returns {string}
  */
  getEosPubKey(key) {
    return ecc.privateToPublic(key);
  },

  toPrivateAddress(privateKey) {
    return ecc.PrivateKey(privateKey).toString();
  },

  importEosAccountByRawKey(privateKey, account, password) {
    let eosChainID = 194;
    let eosBip44PathForm = "m/44'/194'/0'/0/";
    let eosWalletID = 6;
    let config = utils.getConfigSetting('sdk:config', undefined);

    let index = hdUtil.getRawKeyCount(eosChainID);
    let path = eosBip44PathForm + index;
    let rawPriv = wif.decode(privateKey).privateKey;
    let pubKey = this.getEosPubKey(privateKey);

    hdUtil.importPrivateKey(path, rawPriv, password);
    hdUtil.importUserAccount(config.network, eosWalletID, path, account, pubKey, 'active');
    // hdUtil.createUserAccount(eosWalletID, path, {"account" : account});
  },

  publicToAddress(publicKey) {
    let address = ethUtil.publicToAddress(Buffer.from(this.hexTrip0x(publicKey), 'hex'), true).toString('hex');
    return this.hexAdd0x(address);
  },

  /**
   * isEthAddress
   * @function isEthAddress
   * @param {string} address    - Eth address
   * @returns {boolean}
   * true: Eth address
   * false: Non Eth address
   */
  isEthAddress(address) {
    let validate;
    if (/^0x[0-9a-f]{40}$/.test(address)) {
      validate = true;
    } else if (/^0x[0-9A-F]{40}$/.test(address)) {
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
  isWanAddress(address) {
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
   * isEosAccount
   * @function isEosAccount
   * @param {string} account    - Eos account 1-5a-z
   * @returns {boolean}
   * true: Valid Account
   * false: Invalid Account
   */
  isEosAccount(account) {
    let validate;
    if (/^[1-5a-z]{1,12}$/.test(account)) {
      validate = true;
    } else {
      validate = false;
    }
    return validate;
  },

    /**
   * isXrpAccount
   * @function isXrpAccount
   * @param {string} account
   * @returns {boolean}
   * true: Valid Account
   * false: Invalid Account
   */
  isXrpAccount(account) {
    try {
      return [rippleApi.isValidClassicAddress(account), rippleApi.isValidXAddress(account)]
    } catch(err) {
      logger.debug("isXrpAccountError:", err);
      return [false, false];
    }
  },

  isValidXRPSecret(secret) {
    const api = new RippleAPI();
    try {
      return api.isValidSecret(secret);
    } catch(err) {
      logger.debug("isValidXRPSecretError:", err);
      return false;
    }
  },

  /**
   * checkEosAccountExists
   * @function checkEosAccountExists
   * @param {string} account    - Eos account 1-5a-z
   * @returns {boolean}
   * true: Account Exist
   * false: Account not Exist
   */
  async checkEosAccountExists(account) {
    let tryTimes = utils.getConfigSetting("sdk:config:tryTimes", 6);
    for (let i = 0; i <= tryTimes; i++) {
      logger.debug("checkEosAccountExists exec for time", i);
      try {
        await this.getAccountInfo('EOS', account);
        return true;
      } catch (err) {
        if (err.indexOf('unknown key') !== -1) {
          return false;
        } else if (i === tryTimes) {
          throw (new Error('checkEosAccountExists failed after tryTimes, err is ' + err.toString()));
        } else {
          logger.warn("checkEosAccountExists failed for time", i, err);
        }
      }
    }
  },

  /**
   * isEosPublicKey
   * @function isEosPublicKey
   * @param {string} key    - Eos private key
   * @returns {boolean}
   * true: Valid key
   * false: Invalid key
   */
  isEosPublicKey(key) {
    let validate;
    if (ecc.isValidPublic(key) || (key.startsWith('EOS') && key.length === 53)) {
      validate = true;
    } else {
      validate = false;
    }
    return validate;
  },

  /**
   * isEosPrivateKey
   * @function isEosPrivateKey
   * @param {string} key    - Eos private key
   * @returns {boolean}
   * true: Valid key
   * false: Invalid key
   */
  isEosPrivateKey(key) {
    let validate;
    if (ecc.isValidPrivate(key) || (key.startsWith('5') && key.length === 51)) {
      validate = true;
    } else {
      validate = false;
    }
    return validate;
  },

  /**
   * get all Eth accounts on local host
   * @function getEthAccounts
   * @returns {string[]}
   */
  getEthAccounts() {
    let config = utils.getConfigSetting('sdk:config', undefined);
    let ethAddrs = Object.keys(new KeystoreDir(config.ethKeyStorePath).getAccounts());
    return ethAddrs;
  },
  /**
   * get all Wan accounts on local host
   * @function getWanAccounts
   * @returns {string[]}
   */
  getWanAccounts() {
    let config = utils.getConfigSetting('sdk:config', undefined);
    let wanAddrs = Object.keys(new KeystoreDir(config.wanKeyStorePath).getAccounts());
    return wanAddrs;
  },
  /**
   * get all Eos accounts from hdwallet DB
   * @function getEosAccounts
   * @returns {string[]}
   */
  getEosAccounts() {
    let eosChainID = 194;
    let config = utils.getConfigSetting('sdk:config', undefined);
    let eosAddrs = hdUtil.getImportAccountsForChain(config.network, eosChainID).accounts;
    return eosAddrs;
  },
  /**
   * get all Eos accounts from Pubkey
   * @function getEosAccountsByPubkey
   * @returns {string[]}
   */
  async getEosAccountsByPubkey(chain, pubkey) {
    let eosAddrs = await this.getAccounts(chain, pubkey);
    return eosAddrs;
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
      bs = await this.getMultiBalances(ethAddrs, 'ETH');
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
    let bs = await this.getMultiBalances(wanAddrs, 'WAN');

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
    try {
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
    } catch (error) {
      console.log("Error getWanAccountsInfoByWeb3");
    }

  },
  async getWanBalanceByWeb3(addr) {
    return new Promise(function (resolve, reject) {
      let web3 = global.sendByWeb3.web3;
      web3.eth.getBalance(addr, function (err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    });
  },
  /**
   * get all Eos accounts Info on local host with balance info and permission
   * @function getEosAccountsInfo
   * @async
   * @returns {Promise<Array>}
   */
  async getEosAccountsInfo() {
    let infos = [];

    try {
      let eosAccountList = await this.getEosAccounts();
      for (var eosAddr in eosAccountList) {
        let info = await this.getEosAccountInfo(eosAddr);
        info.permission = eosAccountList[eosAddr];
        infos.push(info);
      }
    } catch (err) {
      logger.error("getEOSAccountsInfo", err);
      return [];
    }
    logger.debug("EOS Accounts info: ", infos);
    return infos;
  },
  /**
 * get Eos account Detail Info by account on local host
 * @function getEosAccountInfo
 * @async
 * @returns {Promise<>}
 */
  async getEosAccountInfo(account) {
    let info = {};
    try {
      let data = await this.getAccountInfo('EOS', account);

      if (data.core_liquid_balance) {
        info.balance = parseFloat(data.core_liquid_balance.slice(0, -4));
      }
      info.netBalance = data.net_weight / 10000;
      info.cpuBalance = data.cpu_weight / 10000;
      info.ramAvailable = (data.ram_quota - data.ram_usage) / 1024; //unit KB
      info.ramTotal = data.ram_quota / 1024;
      // info.netAvailable = (data.net_limit.max - data.net_limit.used)/1024; //unit KB
      info.netAvailable = data.net_limit.available / 1024; //unit KB
      info.netTotal = data.net_limit.max / 1024;
      // info.cpuAvailable = (data.cpu_limit.max - data.cpu_limit.used) / 1000; //unit ms
      info.cpuAvailable = data.cpu_limit.available / 1000; //unit ms
      info.cpuTotal = data.cpu_limit.max / 1000;
      info.address = account;

      let activeKeys = [], ownerKeys = [];
      for (var permission of data.permissions) {
        if (permission.perm_name === 'active') {
          for (var index in permission.required_auth.keys) {
            activeKeys.push(permission.required_auth.keys[index].key);
          }
        }
        if (permission.perm_name === 'owner') {
          for (var index in permission.required_auth.keys) {
            ownerKeys.push(permission.required_auth.keys[index].key);
          }
        }
      }
      info.activeKeys = activeKeys;
      info.ownerKeys = ownerKeys;
    } catch (err) {
      logger.error("getEosAccountInfo", err);
      return {};
    }
    logger.debug("EOS Account info: ", info);
    return info;
  },
  /**
   * Get GWei to Wei , used for gas price.
   * @function getGWeiToWei
   * @param amount
   * @param exp
   * @returns {number}
   */
  getGWeiToWei(amount, exp = 9) {
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
  weiToToken(tokenWei, decimals = 18) {
    return utils.toBigNumber(tokenWei).dividedBy('1e' + decimals).toString(10);
  },
  /**
   * tokenToWei
   * @function tokenToWei
   * @param {number}token
   * @param {number} decimals
   * @returns {string}
   */
  tokenToWei(token, decimals = 18) {
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
  tokenToWeiHex(token, decimals = 18) {
    let wei = utils.toBigNumber(token).times('1e' + decimals).trunc();
    return '0x' + wei.toString(16);
  },
  /**
   * get the decimal of the token
   * @function getDecimalByScAddr
   * @param {string} contractAddr - the token's contract address
   * @param {string} chainType    - enum{'ETH', 'WAN','BTC'}
   * @returns {number}
   */
  getDecimalByScAddr(contractAddr, chainType) {
    let chainName = this.getSrcChainNameByContractAddr(contractAddr, chainType);
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
  calculateLocWanFee(value, coin2WanRatio, txFeeRatio) {
    let wei = web3utils.toWei(utils.toBigNumber(value));

    return this.calculateLocWanFeeWei(wei, coin2WanRatio, txFeeRatio);
  },

  calculateLocWanFeeWei(value, coin2WanRatio, txFeeRatio) {
    let wei = utils.toBigNumber(value);
    const DEFAULT_PRECISE = 10000;
    let fee = wei.mul(coin2WanRatio).mul(txFeeRatio).div(DEFAULT_PRECISE).div(DEFAULT_PRECISE).trunc();

    return '0x' + fee.toString(16);
  },

  sleep(time) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        resolve();
      }, time);
    });
  },
  async lockMutex(mutex) {
    while (global.mutexNonce) {
      await this.sleep(3);
    }
    global.mutexNonce = true;
  },
  async unlockMutex(mutex) {
    global.mutexNonce = false;
  },
  getNonceByLocal(addr, chainType) {
    let self = this;
    return new Promise(async (resolve, reject) => {
      await self.lockMutex(global.mutexNonce);
      let retNonce;
      try {
        let noncePendingCurrent = Number(await self.getNonce(addr, chainType, true));
        let mapAccountNonce = global.mapAccountNonce;
        if (mapAccountNonce.get(chainType).has(addr)) {
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
              nonceHoleList.splice(0, 1);
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
        } else {
          let accountNonceObject = {
            key: addr,
            usedPendingNonce: noncePendingCurrent,
            nonceHoleList: [],
          };
          mapAccountNonce.get(chainType).set(addr, accountNonceObject);
          let nonce = noncePendingCurrent;
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
  addNonceHoleToList(addr, chainType, nonce) {
    let self = this;
    return new Promise(async function (resolve, reject) {
      try {
        await self.lockMutex(global.mutexNonce);
        //let accountNonceObject = global.mapAccountNonce.get(chainType).get(addr);
        if (global.mapAccountNonce.get(chainType).has(addr)) {
          let accountNonceObject = global.mapAccountNonce.get(chainType).get(addr);
          if (accountNonceObject.nonceHoleList.indexOf(Number(nonce)) === -1) {
            accountNonceObject.nonceHoleList.push(Number(nonce));
            accountNonceObject.nonceHoleList = accountNonceObject.nonceHoleList.sort((a,b)=>a-b);
          }
        }
        await self.unlockMutex(global.mutexNonce);
        resolve(nonce);
      } catch (err) {
        await self.unlockMutex(global.mutexNonce);
        reject(err);
      }
    })
  },

  /**
   * @function getNonceByWeb3
   * @param addr, includePendingOrNot
   * @returns {Promise<any>}
   */
  getNonceByWeb3(addr, includePendingOrNot = true) {
    let web3 = global.sendByWeb3.web3;
    let nonce;
    return new Promise(function (resolve, reject) {
      if (includePendingOrNot) {
        web3.eth.getTransactionCount(addr, 'pending', function (err, result) {
          if (!err) {
            nonce = '0x' + result.toString(16);
            resolve(nonce);
          } else {
            reject(err);
          }
        })
      } else {
        web3.eth.getTransactionCount(addr, function (err, result) {
          if (!err) {
            nonce = '0x' + result.toString(16);
            resolve(nonce);
          } else {
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
  sendTransByWeb3(signedData) {
    return global.sendByWeb3.sendTrans(signedData);
  },

  /**
   * Revoke
   */
  getOutRevokeEvent(chainType, hashX, toAddr) {
    // Outbound revoke
    let config = utils.getConfigSetting('sdk:config', undefined);
    let topic = [ccUtil.getEventHash(config.crossChainScDict[chainType].EVENT.Burn.walletHtlc[2], config.crossChainScDict[chainType].CONTRACT.crossScAbi), hashX, null, null];
    return this.getHtlcEvent(topic, config.crossChainScDict[chainType].CONTRACT.crossScAddr, chainType);
  },

  getInRevokeEvent(chainType, hashX, toAddr) {
    let config = utils.getConfigSetting('sdk:config', undefined);
    let topic = [ccUtil.getEventHash(config.crossChainScDict[chainType].EVENT.Mint.walletHtlc[2], config.crossChainScDict[chainType].CONTRACT.crossScAbi), hashX, null, null];
    return this.getHtlcEvent(topic, config.crossChainScDict[chainType].CONTRACT.crossScAddr, chainType);
  },

  getOutErc20RevokeEvent(chainType, hashX, toAddr) {
    let config = utils.getConfigSetting('sdk:config', undefined);
    let topic = [ccUtil.getEventHash(config.crossChainScDict[chainType].EVENT.Burn.walletHtlc[2], config.crossChainScDict[chainType].CONTRACT.crossScAbi), hashX, null, null];
    return this.getHtlcEvent(topic, config.crossChainScDict[chainType].CONTRACT.crossScAddr, chainType);
  },

  getInErc20RevokeEvent(chainType, hashX, toAddr) {
    let config = utils.getConfigSetting('sdk:config', undefined);
    let topic = [ccUtil.getEventHash(config.crossChainScDict[chainType].EVENT.Mint.walletHtlc[2], config.crossChainScDict[chainType].CONTRACT.crossScAbi), hashX, null, null];
    return this.getHtlcEvent(topic, config.crossChainScDict[chainType].CONTRACT.crossScAddr, chainType);
  },

  getOutEosRevokeEvent(chainType, hashX, toAddr) {
    let config = utils.getConfigSetting('sdk:config', undefined);
    let topic = [ccUtil.getEventHash(config.outRevokeEventEos, config.wanHtlcAbiEos), null, hashX];
    return this.getHtlcEvent(topic, config.wanHtlcAddrEos, chainType);
  },

  getInEosRevokeEvent(chainType, hashX, toAddr, lockedTime) {
    let self = this;
    return new Promise(async function (resolve, reject) {
      try {
        let config = utils.getConfigSetting('sdk:config', undefined);
        let filter = action => (action.hasOwnProperty('action_trace') && ['inrevoke'].includes(action.action_trace.act.name) && action.action_trace.act.data.xHash === self.hexTrip0x(hashX)) ||
          (action.hasOwnProperty('act') && ['inrevoke'].includes(action.act.name) && action.act.data.xHash === self.hexTrip0x(hashX));
        let options = {};
        // if (config.network === 'testnet') {
        options.filter = config.eosHtlcAddr + ':inrevoke';
        options.act_name = 'inrevoke';
        if (lockedTime) {
          options.after = new Date(Number(lockedTime) * 1000).toISOString();
        }
        // }
        let result = await self.getActions(chainType, config.eosHtlcAddr, options);
        let actions = result.filter(filter);
        console.log(actions);
        resolve(actions);
      } catch (err) {
        reject(err);
      }
    });
  },

  /**
   * Redeem
   */
  getOutRedeemEvent(chainType, hashX, toAddr) {
    let config = utils.getConfigSetting('sdk:config', undefined);
    // WETH --> ETH
    let topic = [ccUtil.getEventHash(config.crossChainScDict[chainType].EVENT.Burn.walletHtlc[1], config.crossChainScDict[chainType].CONTRACT.crossScAbi), hashX, null, null];
    return this.getHtlcEvent(topic, config.crossChainScDict[chainType].CONTRACT.crossScAddr, chainType);
  },

  getInRedeemEvent(chainType, hashX, toAddr) {
    let config = utils.getConfigSetting('sdk:config', undefined);
    // ETH --> WETH
    let topic = [ccUtil.getEventHash(config.crossChainScDict[chainType].EVENT.Mint.walletHtlc[1], config.crossChainScDict[chainType].CONTRACT.crossScAbi), hashX, null, null];
    return this.getHtlcEvent(topic, config.crossChainScDict[chainType].CONTRACT.crossScAddr, chainType);
  },

  getOutErc20RedeemEvent(chainType, hashX, toAddr) {
    let config = utils.getConfigSetting('sdk:config', undefined);
    // WERC20 --> ERC20
    let topic = [ccUtil.getEventHash(config.crossChainScDict[chainType].EVENT.Burn.walletHtlc[1], config.crossChainScDict[chainType].CONTRACT.crossScAbi), hashX, null, null];
    return this.getHtlcEvent(topic, config.crossChainScDict[chainType].CONTRACT.crossScAddr, chainType);
  },

  getInErc20RedeemEvent(chainType, hashX, toAddr) {
    let config = utils.getConfigSetting('sdk:config', undefined);
    // ERC20 --> WERC20
    let topic = [ccUtil.getEventHash(config.crossChainScDict[chainType].EVENT.Mint.walletHtlc[1], config.crossChainScDict[chainType].CONTRACT.crossScAbi), hashX, null, null];
    return this.getHtlcEvent(topic, config.crossChainScDict[chainType].CONTRACT.crossScAddr, chainType);
  },

  getOutEosRedeemEvent(chainType, hashX, toAddress, lockedTime) {
    let self = this;
    return new Promise(async function (resolve, reject) {
      try {
        let config = utils.getConfigSetting('sdk:config', undefined);
        let filter = action => (action.hasOwnProperty('action_trace') && ['outredeem'].includes(action.action_trace.act.name) && self.getSha256HashKey(self.hexAdd0x(action.action_trace.act.data.x)) === self.hexAdd0x(hashX) && action.action_trace.act.data.user === toAddress) ||
          (action.hasOwnProperty('act') && ['outredeem'].includes(action.act.name) && self.getSha256HashKey(self.hexAdd0x(action.act.data.x)) === self.hexAdd0x(hashX) && action.act.data.user === toAddress);
        let options = {};
        // if (config.network === 'testnet') {
        options.filter = config.eosHtlcAddr + ':outredeem';
        options.act_name = 'outredeem';
        if (lockedTime) {
          options.after = new Date(Number(lockedTime) * 1000).toISOString();
        }
        // }
        let result = await self.getActions(chainType, config.eosHtlcAddr, options);
        let actions = result.filter(filter);
        console.log(actions);
        resolve(actions);
      } catch (err) {
        reject(err);
      }
    });
  },

  getInEosRedeemEvent(chainType, hashX, toAddr) {
    let config = utils.getConfigSetting('sdk:config', undefined);
    let topic = [ccUtil.getEventHash(config.inRedeemEventEos, config.wanHtlcAbiEos), toAddr, hashX, null];
    return this.getHtlcEvent(topic, config.wanHtlcAddrEos, chainType);
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
      throw (new Error('balance can not afford fee and target transfer value'));
    }

    return { inputs, change, fee }
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
      throw (new Error('utxo balance is not enough'));
    }

    let { inputs, outputs, fee } = this.btcCoinSelect(utxos, target, feeRate);

    // .inputs and .outputs will be undefined if no solution was found
    if (!inputs || !outputs) {
      throw (new Error('utxo balance is not enough'));
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

    return { rawTx: rawTx, fee: fee };
  },

  getBtcWanTxHistory(option) {
    // NOTICE: BTC normal tx and cross tx use same collection !!
    let config = utils.getConfigSetting('sdk:config', undefined);
    let collection = config.crossCollectionBtc;
    return global.wanDb.getItemAll(collection, option);
  },

  insertNormalTx(tx, status = 'Sent', source = "external", satellite = {}) {
    if (typeof tx !== 'object') {
      throw new error.InvalidParameter("Insert normal transaction got invalid tx!");
    }

    let collection = utils.getConfigSetting('sdk:config:normalCollection', 'normalTrans');

    if (!tx.hasOwnProperty('hashX')) {
      let x = this.generatePrivateKey();
      tx.hashX = this.getHashKey(x);
    }

    let now = parseInt(Number(Date.now()) / 1000).toString();
    let record = {
      "hashX": tx.hashX,
      "txHash": tx.txHash,
      "from": tx.from,
      "to": tx.to,
      "value": tx.value,
      "gasPrice": tx.gasPrice,
      "gasLimit": tx.gasLimit,
      "nonce": tx.nonce,
      "sendTime": tx.sendTime || now,
      "sentTime": tx.sentTime || now,
      "successTime": "",
      "chainAddr": tx.srcSCAddrKey,
      "chainType": tx.srcChainType,
      "tokenSymbol": tx.tokenSymbol,
      "status": status,
      "source": source
    }

    Object.assign(record, satellite);

    global.wanDb.insertItem(collection, record);
  },

  insertCrossTx(tx, status = 'LockSent', source = "external", satellite = {}) {
    if (typeof tx !== 'object') {
      throw new error.InvalidParameter("Insert cross transaction got invalid tx!");
    }

    let collection = utils.getConfigSetting('sdk:config:crossCollection', 'crossTrans');

    if (!tx.hasOwnProperty('hashX')) {
      let x = this.generatePrivateKey();
      tx.hashX = this.getHashKey(x);
    }

    let now = parseInt(Number(Date.now()) / 1000).toString();
    let record = {
      "hashX": tx.hashX,
      "from": tx.from,
      "fromAddr": tx.fromAddr,
      "to": tx.to,
      "toAddr": tx.toAddr,
      "storeman": tx.storeman,
      "tokenPairID": tx.tokenPairID,
      "value": tx.value,
      "contractValue": tx.contractValue,
      "crossValue": tx.crossValue,
      "networkFee": tx.networkFee,
      "gasPrice": tx.gasPrice,
      "gasLimit": tx.gasLimit,
      "nonce": tx.nonce,
      "sendTime": tx.sendTime || now,
      "lockedTime": "",
      "buddyLockedTime": "",
      "srcChainAddr": tx.srcSCAddrKey,
      "dstChainAddr": tx.dstSCAddrKey,
      "srcChainType": tx.srcChainType,
      "dstChainType": tx.dstChainType,
      "crossMode": tx.crossMode,
      "crossType": tx.crossType,
      "approveTxHash": tx.approveTxHash,
      "approveZeroTxHash": tx.approveZeroTxHash,
      "lockTxHash": tx.txHash,
      "redeemTxHash": "",
      "revokeTxHash": "",
      "buddyLockTxHash": "",
      "tokenSymbol": tx.tokenSymbol,
      "tokenStand": tx.tokenStand,
      "htlcTimeOut": "",
      "buddyLockedTimeOut": "",
      "status": status,
      "source": source
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
  getDataByFuncInterface(abi, contractAddr, funcName, ...args) {
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
    let keystoreDir = new KeystoreDir(keystorePath);
    let account = keystoreDir.getAccount(address);
    let privateKey = account.getPrivateKey(password);
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
    const tx = new TxClass(trans);
    tx.sign(privateKey);
    const serializedTx = tx.serialize();
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
      let e = evts.find(function (evt) {
        return (web3utils.signFunction(evt) === log.topics[0].replace("0x", ""));
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
  getSrcChainName() {
    return global.crossInvoker.getSrcChainName();
  },
  /**
   * Get the left {@link CrossInvoker#tokenInfoMap token info} supported by system after users select source chain.
   * @function getDstChainName
   * @param selectedSrcChainName
   * @returns {Map<string, Map<string, Object>>|Map<any, any>}
   */
  getDstChainName(selectedSrcChainName) {
    return global.crossInvoker.getDstChainName(selectedSrcChainName);
  },
  /**
   * Get storeman group list for cross chain.(Source chain -> Destination chain)
   * @function getStoremanGroupList
   * @param {Object} srcChainName - {@link CrossInvoker#tokenInfoMap Token info. on source chain.}
   * @param {Object} dstChainName - {@link CrossInvoker#tokenInfoMap Token info. on destination chain.}
   * @returns {Promise<Array>}
   */
  getStoremanGroupList(srcChainName, dstChainName) {
    return global.crossInvoker.getStoremanGroupList(srcChainName, dstChainName);
  },
  /**
   * Get token srcChain info for normal trans. in two layers {@link CrossInvoke#tokenInfoMap MAP} data structure.
   * @function getSrcChainInfoByContractAddr
   * @param contractAddr
   * @param chainType
   * @returns {Object|null}
   */
  getChainInfoByContractAddr(contractAddr, chainType, tokenPairID = null) {
    return global.crossInvoker.getChainInfoByContractAddr(contractAddr, chainType, tokenPairID);
  },
  /**
   * Get token info. in two layers {@link CrossInvoke#tokenInfoMap MAP} data structure.
   * @function getSrcChainNameByContractAddr
   * @param contractAddr
   * @param chainType
   * @returns {Object|null}
   */
  getSrcChainNameByContractAddr(contractAddr, chainType, tokenPairID = null) {
    return global.crossInvoker.getSrcChainNameByContractAddr(contractAddr, chainType, tokenPairID);
  },
  /**
   * getKeyStorePaths
   * @function getKeyStorePaths
   * @param srcChainName
   * @param dstChainName
   * @returns {Array}
   */
  getKeyStorePaths(srcChainName, dstChainName) {
    return global.crossInvoker.getKeyStorePaths(srcChainName, dstChainName);
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
  invokeCrossChain(srcChainName, dstChainName, action, input) {
    return global.crossInvoker.invoke(srcChainName, dstChainName, action, input);
  },

  async scanOTA(wid, path, password) {
    return global.OTAbackend.startScan(wid, path, password);
  },

  stopScanOTA(wid, path) {
    return global.OTAbackend.stopScan(wid, path);
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
        "tokenStand": "TOKEN",
        "htlcTimeOut": "1541138045",
        "buddyLockedTimeOut": "1541008509"
      }
   </pre>
   * @returns {{code: boolean, result: null}|transUtil.retResult|{code, result}}
   */
  canRedeem(record) {
    let retResultTemp = {};
    Object.assign(retResultTemp, retResult);

    let lockedTime = Number(record.lockedTime);
    let buddyLockedTime = Number(record.buddyLockedTime);
    let status = record.status;
    let buddyLockedTimeOut = Number(record.buddyLockedTimeOut);


    //global.lockedTime
    if (status !== 'BuddyLocked' &&
      // status !== 'RedeemSent' &&
      status !== 'RedeemSending' &&
      status !== 'RedeemFail') {
      retResultTemp.code = false;
      retResultTemp.result = "waiting buddy lock";
      return retResultTemp;
    }
    if (record.crossType === 'FAST') {
      retResultTemp.code = false;
      retResultTemp.result = "FAST cross doesn't need redeem";
      return retResultTemp;
    }
    let currentTime = Number(Date.now()) / 1000; //unit s
    logger.debug("record.hashX, lockedTime,buddyLockedTime,status, currentTime, buddyLockedTimeOut\n");
    logger.debug(record.hashX, lockedTime, buddyLockedTime, status, currentTime, buddyLockedTimeOut);
    if (currentTime < buddyLockedTimeOut) {
      retResultTemp.code = true;
      return retResultTemp;
    } else {
      retResultTemp.code = false;
      retResultTemp.result = "Hash lock time is not meet.";
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
  canRevoke(record) {
    let retResultTemp = {};

    Object.assign(retResultTemp, retResult);
    let lockedTime = Number(record.lockedTime);
    let buddyLockedTime = Number(record.buddyLockedTime);
    let status = record.status;
    let htlcTimeOut = Number(record.htlcTimeOut);

    if (status !== 'BuddyLocked' &&
      status !== 'Locked' &&
      status !== 'RedeemSending' &&
      status !== 'RedeemSent' &&
      // status !== 'RevokeSent' &&
      status !== 'RevokeSending' &&
      status !== 'RevokeFail' &&
      status !== 'RedeemFail' &&
      status !== 'RevokeSendFail' &&
      status !== 'RedeemSendFail') {
      retResultTemp.code = false;
      retResultTemp.result = "Can not revoke,status is not BuddyLocked or Locked";
      return retResultTemp;
    }
    if (record.crossType === 'FAST') {
      retResultTemp.code = false;
      retResultTemp.result = "FAST cross doesn't need revoke";
      return retResultTemp;
    }
    let currentTime = Number(Date.now()) / 1000;
    logger.debug("record.hashX, lockedTime,buddyLockedTime,status, currentTime, htlcTimeOut\n");
    logger.debug(record.hashX, lockedTime, buddyLockedTime, status, currentTime, htlcTimeOut);
    if (currentTime > htlcTimeOut) {
      retResultTemp.code = true;
      return retResultTemp;
    } else {
      retResultTemp.code = false;
      retResultTemp.result = "Hash lock time is not meet.";
      return retResultTemp;
    }
  },
  /** Since one contract has two addresses, one is original address, the other is buddy address(contract address on WAN)
   * @function
   * @param contractAddr
   * @param chainType
   * @returns {string}
   */
  getKeyByBuddyContractAddr(contractAddr, chainType) {
    return global.crossInvoker.getKeyByBuddyContractAddr(contractAddr, chainType);
  },
  /**
   * Used to set initial nonce for Test Only.
   * @function setInitNonceTest
   * @param initNonce
   */
  setInitNonceTest(initNonce) {
    global.nonceTest = initNonce;
  },
  /**
   * Get nonce based on initial nonce for Test.
   * @function getNonceTest
   * @returns {*|null|number}
   */
  getNonceTest() {
    global.nonceTest = Number(global.nonceTest) + 1;
    return global.nonceTest;
  },
  /**
   *@function getCrossInvokerConfig
   * @param srcChainName          - source {@link CrossInvoke#tokenInfoMap tokenInfo}
   * @param dstChainName          - destination {@link CrossInvoke#tokenInfoMap tokenInfo}
   * @returns {*}                 - return computed config.{@link CrossChain#config example config}
   */
  getCrossInvokerConfig(srcChainName, dstChainName) {
    return global.crossInvoker.getCrossInvokerConfig(srcChainName, dstChainName);
  },
  /**
   * getCrossInvokerClass
   * @function getCrossInvokerClass
   * @param crossInvokerConfig    - see {@link ccUtil#getCrossInvokerConfig crossInvokerConfig}
   * @param action                - APPROVE,LOCK, REDEEM, REVOKE
   * @returns {CrossChain|*}      - instance of class CrossChain or sub class of CrossChain.
   */
  getCrossInvokerClass(crossInvokerConfig, action) {
    return global.crossInvoker.getCrossInvokerClass(crossInvokerConfig, action);
  },
  /**
   * get CrossChain instance.
   * @param crossInvokerClass       - see {@link ccUtil#getCrossInvokerClass}
   * @param crossInvokerInput       - see {@link CrossChain#input}
   * @param crossInvokerConfig      - see {@link ccUtil#getCrossInvokerConfig}
   * @returns {any|CrossChain}      - uses can call return  value's run function to finish cross chain transaction.
   */
  getCrossChainInstance(crossInvokerClass, crossInvokerInput, crossInvokerConfig) {
    return global.crossInvoker.getInvoker(crossInvokerClass, crossInvokerInput, crossInvokerConfig);
  },
  /**
   * get src chain dic. for end users to select source chain.
   * @function getSrcChainDic
   * @returns {*}                 - sub collection{'ETH','BTC','WAN'}
   */
  getSrcChainDic() {
    return global.crossInvoker.getSrcChainDic();
  },
  /**
   * Override properies' value  to '*******'
   * @function hiddenProperties
   * @param inputObj
   * @param properties
   */
  hiddenProperties(inputObj, properties) {
    let retObj = {};
    Object.assign(retObj, inputObj);
    for (let propertyName of properties) {
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
  hiddenProperties2(inputObj, properties) {
    let retObj = {};
    Object.assign(retObj, inputObj);
    for (let propertyName of properties) {
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
  differenceABTokens(tokensA, tokensB) {
    let mapB = new Map();
    for (let token of tokensB) {
      mapB.set(token.tokenOrigAddr, token);
    }
    let diffMap = new Map();
    for (let token of tokensA) {
      if (mapB.has(token.tokenOrigAddr) === false) {
        diffMap.set(token.tokenOrigAddr, token);
      }
    }
    let ret = [];
    for (let value of diffMap.values()) {
      ret.push(value);
    }
    return ret;
  },

  getRegTokens(crossChain) {
    return global.crossInvoker.getRegTokens(crossChain);
  },

  getRegTokenInfo(crossChain, tokenOrigAddr) {
    let tokens = global.crossInvoker.getRegTokens(crossChain);
    let token = {};
    for (let i = 0; i < tokens.length; i++) {
      if ((tokens[i].hasOwnProperty('tokenOrigAddr') && tokens[i]['tokenOrigAddr'] === tokenOrigAddr) ||
        (tokens[i].hasOwnProperty('tokenOrigAccount') && tokens[i]['tokenOrigAccount'] === tokenOrigAddr)) {
        token = tokens[i];
        break;
      }
    }
    return token;
  },

  /**
   * ========================================================================
   * RPC communication - iWAN
   * ========================================================================
   */

  isContract(address) {
    return new Promise(function (resolve, reject) {
      try {
        let web3Url = global.iWAN._client.ws_url;
        var web3 = new Web3(new Web3.providers.WebsocketProvider(web3Url));
        web3.eth.getCode(address, function (err, result) {
          if (err) {
            web3.currentProvider.disconnect();
            reject(err);
          } else {
            web3.currentProvider.disconnect();
            if (result === '0x') {
              resolve(false);
            } else {
              resolve(true);
            }
          }
        })
      } catch (err) {
        if (web3) {
          web3.currentProvider.disconnect();
        }
        reject(err);
      }
    })
  },

  callScFunc(chainType, scAddr, name, args, abi, version) {
    return global.iWAN.call('callScFunc', networkTimeout, [chainType, scAddr, name, args, abi, version]);
  },

  /**
   * get storeman groups .
   */
  getSmgList(chainType) {
    return global.iWAN.call('getStoremanGroups', networkTimeout, [chainType]);
  },

  /**
   * @function getTxReceipt
   * @param chainType
   * @param txhash
   * @returns {*}
   */
  getTxReceipt(chainType, txhash, options) {
    return global.iWAN.call('getTransactionReceipt', networkTimeout, [chainType, txhash, options]);
  },

  /**
   * @function getTxInfo
   * @param chainType
   * @param txhash
   * @returns {*}
   */
  getTxInfo(chainType, txhash, options) {
    options = options || { format: true };
    return global.iWAN.call('getTxInfo', networkTimeout, [chainType, txhash, options]);
  },

  /**
   * Get the ration between WAN and crosschain.
   * @function
   * @param crossChain
   * @returns {*}
   */
  getC2WRatio(crossChain = 'ETH') {
    return global.iWAN.call('getCoin2WanRatio', networkTimeout, [crossChain]);
  },

  /**
   * Get coin balance.
   * @function getBalance
   * @param addr
   * @param chainType
   * @returns {*}
   */
  getBalance(addr, chainType = 'WAN') {
    return global.iWAN.call('getBalance', networkTimeout, [chainType, addr]);
  },

  /**
   * @function getMultiBalances
   * @param addrs
   * @param chainType
   * @returns {*}
   */
  getMultiBalances(addrs, chainType = 'WAN') {
    return global.iWAN.call('getMultiBalances', networkTimeout, [chainType, addrs]);
  },

  /**
   * @function getBlockByNumber
   * @param blockNumber
   * @param chainType
   * @returns {*}
   */
  getBlockByNumber(blockNumber, chainType = 'WAN') {
    return global.iWAN.call('getBlockByNumber', networkTimeout, [chainType, blockNumber]);
  },

  /**
   * Get token balance by contract address and users addresses.
   * @function getTokenBalance
   * @param addr address
   * @param tokenScAddr
   * @param chainType
   * @returns {*}
   */
  getTokenBalance(addr, tokenScAddr, chainType) {
    return global.iWAN.call('getTokenBalance', networkTimeout, [chainType, addr, tokenScAddr]);
  },

  /**
   * Get token balance by contract address and users addresses.
   * @function getMultiTokenBalance
   * @param addrs Array addresses
   * @param tokenScAddr
   * @param chainType
   * @returns {*}
   */
  getMultiTokenBalance(addrs, tokenScAddr, chainType) {
    return global.iWAN.call('getMultiTokenBalance', networkTimeout, [chainType, addrs, tokenScAddr]);
  },

  /**
   * Get token balance by contract address and users addresses.
   * @function getMultiTokenBalanceByTokenScAddr
   * @param addrs
   * @param tokenScAddr
   * @param chainType
   * @returns {*}
   */
  getMultiTokenBalanceByTokenScAddr(addrs, tokenScAddr, chainType, symbol = '') {
    return global.iWAN.call('getMultiTokenBalance', networkTimeout, [chainType, addrs, tokenScAddr, symbol]);
  },

  /**
   * Get all ERC 20 tokens from API server. The return information include token's contract address</b>
   * and the buddy contract address of the token.
   * @function getRegErc20Tokens
   * @returns {*}
   */
  getRegTokensFromRPC(crossChain) {
    return global.iWAN.call('getRegTokens', networkTimeout, [crossChain]);
  },

  /**
   * Get all storemen groups which provide special token service, this token's address is tokenScAddr.
   * @function syncTokenStoremanGroups
   * @param tokenScAddr
   * @returns {*}
   */
  syncTokenStoremanGroups(crossChain, tokenScAddr) {
    return global.iWAN.call('getTokenStoremanGroups', networkTimeout, [crossChain, tokenScAddr]);
  },

  /**
   * @function getNonce
   * @param addr
   * @param chainType
   * @param includePendingOrNot
   * @returns {*}
   */
  getNonce(addr, chainType, includePending = true) {
    if (includePending) {
      return global.iWAN.call('getNonceIncludePending', networkTimeout, [chainType, addr]);
    } else {
      return global.iWAN.call('getNonce', networkTimeout, [chainType, addr]);
    }
  },

  async getAddrNonce(addr, chainType) {
    let useLocalNode = utils.getConfigSetting("sdk:config:useLocalNode", false);
    if (useLocalNode) {
      return await this.getNonceByWeb3(addr);
    } else {
      return await this.getNonceByLocal(addr, chainType);
    }
  },

  getTokenInfo(tokenScAddr, chainType) {
    return global.iWAN.call('getTokenInfo', networkTimeout, [chainType, tokenScAddr]);
  },

  getMultiTokenInfo(tokenScArray, chainType) {
    return global.iWAN.call('getMultiTokenInfo', networkTimeout, [chainType, tokenScArray]);
  },

  /**
   * getToken2WanRatio
   * @function getToken2WanRatio
   * @param tokenOrigAddr
   * @param crossChain
   * @returns {*}
   */
  getToken2WanRatio(tokenOrigAddr, crossChain = "ETH") {
    return global.iWAN.call('getToken2WanRatio', networkTimeout, [crossChain, tokenOrigAddr]);
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
  getErc20Allowance(tokenScAddr, ownerAddr, spenderAddr, chainType = 'ETH') {
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
  async waitConfirm(txHash, waitBlocks, chainType, options) {
    if (chainType === 'BTC') {
      let btcTx = await this.getBtcTransaction(txHash);
      let btcConfirmBlocks = utils.getConfigSetting('sdk:config:btcConfirmBlocks', waitBlocks);
      if(btcTx && btcTx.confirmations && btcTx.confirmations >= btcConfirmBlocks){
        btcTx.timestamp = btcTx.time;
        btcTx.blockNumber = btcTx.height;
        btcTx.status = '0x1';
        return btcTx;
      } else {
        return undefined;
      }
    }
    return global.iWAN.call('getTransactionConfirm', networkTimeout, [chainType, waitBlocks, txHash, options]);
  },

  /**
   * @function sendTrans
   * @param signedData
   * @param chainType
   * @returns {*}
   */
  sendTrans(signedData, chainType) {
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
  getOutStgLockEvent(chainType, hashX, toAddress, option = {}) {
    let config = utils.getConfigSetting('sdk:config', undefined);
    let topics = [this.getEventHash(config.crossChainScDict[chainType].EVENT.Burn.smgHtlc[0], config.crossChainScDict[chainType].CONTRACT.crossScAbi), hashX, null, null];
    return global.iWAN.call('getScEvent', networkTimeout, [chainType, config.crossChainScDict[chainType].CONTRACT.crossScAddr, topics, option]);
  },

  /**
   * Users lock on source chain, and wait the lock event of storeman on destination chain.</br>
   * This function is used get the event of lock of storeman.(ETH->WAN coin)
   * @function getInStgLockEvent
   * @param chainType
   * @param hashX
   * @returns {*}
   */
  getInStgLockEvent(chainType, hashX, toAddress, option = {}) {
    let config = utils.getConfigSetting('sdk:config', undefined);
    let topics = [this.getEventHash(config.crossChainScDict[chainType].EVENT.Mint.smgHtlc[0], config.crossChainScDict[chainType].CONTRACT.crossScAbi), hashX, null, null];
    return global.iWAN.call('getScEvent', networkTimeout, [chainType, config.crossChainScDict[chainType].CONTRACT.crossScAddr, topics, option]);
  },

  /**
 * Users fast lock on dst chain, and wait the lock event of storeman on destination chain.</br>
 * This function is used get the event of lock of storeman.(like WAN->ETH coin)
 * @function getStgFastBurnLockEvent
 * @param chainType
 * @param hashX
 * @returns {*}
 */
  getStgFastBurnLockEvent(chainType, hashX, toAddress, option = {}) {
    let config = utils.getConfigSetting('sdk:config', undefined);
    let topics = [this.getEventHash(config.crossChainScDict[chainType].EVENT.Burn.smgRapid[0], config.crossChainScDict[chainType].CONTRACT.crossScAbi), hashX, null, null];
    return global.iWAN.call('getScEvent', networkTimeout, [chainType, config.crossChainScDict[chainType].CONTRACT.crossScAddr, topics, option]);
  },

  /**
   * Users fast lock on source chain, and wait the lock event of storeman on destination chain.</br>
   * This function is used get the event of lock of storeman.(like ETH->WAN coin)
   * @function getStgFasMintLockEvent
   * @param chainType
   * @param hashX
   * @returns {*}
   */
  getStgFasMintLockEvent(chainType, hashX, toAddress, option = {}) {
    let config = utils.getConfigSetting('sdk:config', undefined);
    let topics = [this.getEventHash(config.crossChainScDict[chainType].EVENT.Mint.smgRapid[0], config.crossChainScDict[chainType].CONTRACT.crossScAbi), hashX, null, null];
    return global.iWAN.call('getScEvent', networkTimeout, [chainType, config.crossChainScDict[chainType].CONTRACT.crossScAddr, topics, option]);
  },

/**
 * Users fast Bridge lock on dst chain, and wait the lock event of storeman on destination chain.</br>
 * This function is used get the event of lock of storeman.(like WAN->ETH coin)
 * @function getStgBridgeLockEvent
 * @param chainType
 * @param hashX
 * @returns {*}
 */
getStgBridgeLockEvent(chainType, hashX, toAddress, option = {}) {
  let config = utils.getConfigSetting('sdk:config', undefined);
  let topics = [this.getEventHash(config.crossChainScDict[chainType].EVENT.Lock.smgRapid[0], config.crossChainScDict[chainType].CONTRACT.crossScAbi), this.hexAdd0x(hashX), null, null];
  return global.iWAN.call('getScEvent', networkTimeout, [chainType, config.crossChainScDict[chainType].CONTRACT.crossScAddr, topics, option]);
},

/**
 * Users fast bridge release on source chain, and wait the lock event of storeman on destination chain.</br>
 * This function is used get the event of lock of storeman.(like ETH->WAN coin)
 * @function getStgBridgeReleaseEvent
 * @param chainType
 * @param hashX
 * @returns {*}
 */
getStgBridgeReleaseEvent(chainType, hashX, toAddress, option = {}) {
  let config = utils.getConfigSetting('sdk:config', undefined);
  let topics = [this.getEventHash(config.crossChainScDict[chainType].EVENT.Release.smgRapid[0], config.crossChainScDict[chainType].CONTRACT.crossScAbi), this.hexAdd0x(hashX), null, null];
  return global.iWAN.call('getScEvent', networkTimeout, [chainType, config.crossChainScDict[chainType].CONTRACT.crossScAddr, topics, option]);
},

format_op_return (op_return) {
  //$log.debug('OP_RETURN Unformatted: ' + op_return);
  var content = '';
  if (op_return && op_return.indexOf("OP_RETURN") > -1) {
    var op_string = new String(op_return);
    content = op_string.substring(op_string.lastIndexOf("OP_RETURN") + 9, op_string.length).trim();
    content = this.hex_to_ascii(content);
  } else if (op_return) {
    var op_string = this.hex_to_ascii(op_return);
    for (var i = 3; i < op_string.length; i++) {
      content += op_string[i];
    }
  }
  //$log.debug('OP_RETURN Formatted: ' + content);
  return content;
},

format_cross_op_return (op_return) {
  //$log.debug('OP_RETURN Unformatted: ' + op_return);
  var content = '';
  if (op_return && op_return.indexOf("OP_RETURN") > -1) {
    var op_string = new String(op_return);
    content = op_string.substring(op_string.lastIndexOf("OP_RETURN") + 9, op_string.length).trim();
  }
  //$log.debug('OP_RETURN Formatted: ' + content);
  return content;
},

ascii_to_hex(str) {
  var arr = [];
  for (var i = 0, l = str.length; i < l; i ++) {
    var hex = Number(str.charCodeAt(i)).toString(16);
    arr.push(hex);
  }
  return arr.join('');
},

hex_to_ascii(hexx) {
  var hex = hexx.toString();//force conversion
  var str = '';
  for (var i = 0; i < hex.length; i += 2)
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
},

/**
 * Users fast bridge release on source chain, and wait the release transaction of storeman on BTC chain.</br>
 * This function is used get the event of release of storeman.
 * @function getStgBridgeBTCReleaseEvent
 * @param chainType
 * @param hashX
 * @returns {*}
 */
  async getStgBridgeBTCReleaseEvent(chainType = 'BTC', hashX, toAddress, option = {}) {
    let self = this;
    let filter = { address: [toAddress] };
    Object.assign(option, filter);
    let op_results = await global.iWAN.call('getOpReturnOutputs', networkTimeout, [chainType, option]);
    let result = [];
    let btcDecimals = 8;

    let multiOpTx = op_results.map((tx) => {
      return new Promise(async (resolve, reject) => {
        try {
          if (tx.vout.length === 1) {
            resolve();
          }
          tx.vout.map((out) => {
            if (out.scriptPubKey && out.scriptPubKey.addresses && out.scriptPubKey.addresses.includes(toAddress)) {
              for (let i = tx.vout.length - 1; i >= 0; i--) {
                if (tx.vout[i].scriptPubKey && tx.vout[i].scriptPubKey.hex && tx.vout[i].scriptPubKey.hex.length > 2 && 0 == tx.vout[i].scriptPubKey.hex.indexOf('6a')) {
                  let op_return = self.format_cross_op_return(tx.vout[i].scriptPubKey.asm);
                  // Type: 1, normal userLock; Data: tokenPairID + toAccount + fee
                  // Type: 2, normal smg release; Data: tokenPairId + uniqueId
                  let op_return_smg_type = 2;
                  let op_return_type = op_return.substring(0, 2);
                  if (parseInt(op_return_type) === op_return_smg_type && op_return.length === 70) {
                    let tokenPairId = parseInt(op_return.substring(2, 6), 16);
                    let uniqueId = op_return.substr(6);

                    if (this.hexAdd0x(uniqueId) === this.hexAdd0x(hashX)) {
                      result[0] = tx;
                      result[0].transactionHash = tx.txid;
                      result[0].blockNumber = tx.height;
                      result[0].hashX = uniqueId;
                      result[0].args = {
                        uniqueID: uniqueId,
                        value: self.tokenToWeiHex(out.value, btcDecimals),
                        tokenPairID: tokenPairId,
                        userAccount: toAddress
                      };
                      resolve(result);
                      break;
                    }
                  }
                }
              }
            }
          })
          resolve(result);
        } catch (err) {
          reject(err);
        }
      })
    })
    await Promise.all(multiOpTx);

    return result;
  },

  /**
   * Users lock on source chain, and wait the lock event of storeman on destination chain.</br>
   * This function is used get the event of lock of storeman.(WAN->ETH ERC20 token)
   * @function getOutStgLockEventE20
   * @param chainType
   * @param hashX
   * @returns {*}
   */
  getOutStgLockEventE20(chainType, hashX, toAddress, option = {}) {
    let config = utils.getConfigSetting('sdk:config', undefined);
    let topics = [this.getEventHash(config.crossChainScDict[chainType].EVENT.Burn.smgHtlc[0], config.crossChainScDict[chainType].CONTRACT.crossScAbi), hashX, null, null];
    return global.iWAN.call('getScEvent', networkTimeout, [chainType, config.crossChainScDict[chainType].CONTRACT.crossScAddr, topics, option]);
  },

  /**
   * Users lock on source chain, and wait the lock event of storeman on destination chain.</br>
   * This function is used get the event of lock of storeman.(ETH->WAN ERC20 token)
   * @function getInStgLockEventE20
   * @param chainType
   * @param hashX
   * @returns {*}
   */
  getInStgLockEventE20(chainType, hashX, toAddress, option = {}) {
    let config = utils.getConfigSetting('sdk:config', undefined);
    let topics = [this.getEventHash(config.crossChainScDict[chainType].EVENT.Mint.smgHtlc[0], config.crossChainScDict[chainType].CONTRACT.crossScAbi), hashX, null, null];
    return global.iWAN.call('getScEvent', networkTimeout, [chainType, config.crossChainScDict[chainType].CONTRACT.crossScAddr, topics, option]);
  },

  /**
   * Users lock on source chain, and wait the lock event of storeman on destination chain.</br>
   * This function is used get the event of lock of storeman.(WAN->EOS EOS token)
   * @function getOutStgLockEventEos
   * @param chainType
   * @param hashX
   * @returns {*}
   */
  getOutStgLockEventEos(chainType, hashX, toAddress, lockedTime) {
    let self = this;
    return new Promise(async function (resolve, reject) {
      try {
        let config = utils.getConfigSetting('sdk:config', undefined);
        let filter = action => (action.hasOwnProperty('action_trace') && ['outlock'].includes(action.action_trace.act.name) && action.action_trace.act.data.xHash === self.hexTrip0x(hashX) && action.action_trace.act.data.user === toAddress) ||
          (action.hasOwnProperty('act') && ['outlock'].includes(action.act.name) && action.act.data.xHash === self.hexTrip0x(hashX) && action.act.data.user === toAddress);
        let options = {};
        // if (config.network === 'testnet') {
        options.filter = config.eosHtlcAddr + ':outlock';
        options.act_name = 'outlock';
        if (lockedTime) {
          options.after = new Date(Number(lockedTime) * 1000).toISOString();
        }
        // }
        let result = await self.getActions(chainType, config.eosHtlcAddr, options);
        let actions = result.filter(filter);
        console.log(actions);
        resolve(actions);
      } catch (err) {
        reject(err);
      }
    });
  },

  /**
   * Users lock on source chain, and wait the lock event of storeman on destination chain.</br>
   * This function is used get the event of lock of storeman.(Eos->WAN Eos token)
   * @function getInStgLockEventEos
   * @param chainType
   * @param hashX
   * @returns {*}
   */
  getInStgLockEventEos(chainType, hashX, toAddress, option = {}) {
    let config = utils.getConfigSetting('sdk:config', undefined);
    let topics = ['0x' + wanUtil.sha3(config.inStgLockEventEOS).toString('hex'), toAddress, hashX];
    return global.iWAN.call('getScEvent', networkTimeout, [chainType, config.wanHtlcAddrEos, topics, option]);
  },

  getDepositCrossLockEvent(hashX, walletAddr, chainType, option = {}) {
    let config = utils.getConfigSetting('sdk:config', undefined);
    let topics = [this.getEventHash(config.depositBtcCrossLockEvent, config.HTLCWBTCInstAbi), null, walletAddr, hashX];
    return global.iWAN.call('getScEvent', networkTimeout, [chainType, config.wanchainHtlcAddr, topics, option]);
  },
  getBtcWithdrawStoremanNoticeEvent(hashX, walletAddr, chainType, option = {}) {
    let config = utils.getConfigSetting('sdk:config', undefined);
    let topics = [this.getEventHash(config.withdrawBtcCrossLockEvent, config.HTLCWBTCInstAbi), null, walletAddr, hashX];
    return global.iWAN.call('getScEvent', networkTimeout, [chainType, config.wanchainHtlcAddr, topics, option]);
  },
  /**
   * Get event for topic on address of chainType
   */
  async getHtlcEvent(topic, htlcAddr, chainType, option = {}) {
    return global.iWAN.call('getScEvent', networkTimeout, [chainType, htlcAddr, topic, option]);
  },

  /**
   * Get HTLC locked time, unit seconds.
   * @function  getEthLockTime
   * @param chainType
   * @returns {*}
   */
  getEthLockTime(chainType = 'ETH') {
    let config = utils.getConfigSetting('sdk:config', undefined);
    return global.iWAN.call('getScVar', networkTimeout, [chainType, config.crossChainScDict[chainType].CONTRACT.crossScAddr, 'lockedTime', config.crossChainScDict[chainType].CONTRACT.crossScAbi]);
  },

  /**
   * Get HTLC locked time, unit seconds. (ERC20)
   * @function getE20LockTime
   * @param chainType
   * @returns {*}
   */
  getE20LockTime(chainType = 'ETH') {
    let config = utils.getConfigSetting('sdk:config', undefined);
    return global.iWAN.call('getScVar', networkTimeout, [chainType, config.crossChainScDict[chainType].CONTRACT.crossScAddr, 'lockedTime', config.crossChainScDict[chainType].CONTRACT.crossScAbi]);
  },

  /**
   * Get HTLC locked time, unit seconds.
   * @function  getWanLockTime, for HTLC lock time of BTC
   * @param chainType
   * @returns {*}
   */
  getWanLockTime(chainType = 'WAN') {
    let config = utils.getConfigSetting('sdk:config', undefined);
    return global.iWAN.call('getScVar', networkTimeout, [chainType, config.wanHtlcAddrBtc, 'lockedTime', config.wanAbiBtc]);
  },

  /**
   * Get HTLC locked time, unit seconds. (EOS)
   * @function getEosLockTime
   * @param chainType
   * @returns {*}
   */
  getEosLockTime(chainType = 'WAN') {
    let config = utils.getConfigSetting('sdk:config', undefined);
    return global.iWAN.call('callScFunc', networkTimeout, [chainType, config.wanHtlcAddrEos, 'getEconomics', '', config.wanHtlcAbiEos]);
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
  getE20RevokeFeeRatio(chainType = 'ETH') {
    let p;
    let config = utils.getConfigSetting('sdk:config', undefined);
    if (chainType === 'ETH') {
      p = global.iWAN.call('getScVar', networkTimeout, [chainType, config.ethHtlcAddrE20, 'revokeFeeRatio', config.ethAbiE20]);
    } else {
      if (chainType === 'WAN') {
        p = global.iWAN.call('getScVar', networkTimeout, [chainType, config.wanHtlcAddrE20, 'revokeFeeRatio', config.wanAbiE20]);
      } else {
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
    return global.iWAN.call('importAddress', networkTimeout, ['BTC', address]);
  },

  getBtcTransaction(txhash) {
    return this.getTxInfo('BTC', txhash);
  },

  estimateSmartFee(chainType) {
    return global.iWAN.call('estimateSmartFee', networkTimeout, [chainType]);
  },

  getBlockNumber(chain) {
    return global.iWAN.call('getBlockNumber', networkTimeout, [chain]);
  },

  checkOTAUsed(image, timeout) {
    return global.iWAN.call('checkOTAUsed', timeout || networkTimeout, ['WAN', image]);
  },

  getOTAMixSet(otaAddr, number, timeout) {
    return global.iWAN.call('getOTAMixSet', timeout || networkTimeout, [otaAddr, number]);
  },

  getTransByAddressBetweenBlocks(chain, addr, start, end, timeout) {
    return global.iWAN.call('getTransByAddressBetweenBlocks', timeout || networkTimeout, [chain, addr, start, end]);
  },

  // specific api for EOS
  eosToFloat(str) {
    const floatRegex = /[^\d.-]/g
    return parseFloat(str.replace(floatRegex, ''));
  },

  floatToEos(amount, symbol, decimals) {
    let precision = parseInt(decimals);
    return `${new Decimal(amount).toFixed(precision)} ${symbol}`

    // eosjs 16.0.9
    // let DecimalPad = Eos.modules.format.DecimalPad;
    // let precision = parseInt(decimals);
    // return `${DecimalPad(amount, precision)} ${symbol}`
  },

  getEosChainInfo() {
    return this.getChainInfo('EOS');
  },

  /**
   * Return general network information, getInfo
   * @function getChainInfo
   * @param {*} chain
   */
  getChainInfo(chain) {
    return global.iWAN.call('getChainInfo', networkTimeout, [chain]);
  },

  /**
   * static method of eos, getCurrencyStats
   * @function getStats
   * @param {*} chain
   * @param {*} tokenScAddr
   * @param {*} symbol
   */
  getStats(chain, tokenScAddr, symbol = 'EOS') {
    return global.iWAN.call('getStats', networkTimeout, [chain, tokenScAddr, symbol]);
  },

  /**
   * Fetch a blockchain account Info, getAccount
   * @function getAccounts
   * @param {*} chain
   * @param {*} accountOrPubkey
   */
  getAccountInfo(chain, account) {
    return global.iWAN.call('getAccountInfo', networkTimeout, [chain, account]);
  },

  /**
   * Fetch a blockchain account, getKeyAccounts
   * @function getAccounts
   * @param {*} chain
   * @param {*} pubkey
   */
  getAccounts(chain, pubkey) {
    return global.iWAN.call('getAccounts', networkTimeout, [chain, pubkey]);
  },

  /**
   * getAbi of the contract
   * @function getAbi
   * @param {*} chain
   * @param {*} tokenScAddr
   */
  getAbi(chain, tokenScAddr) {
    return global.iWAN.call('getAbi', networkTimeout, [chain, tokenScAddr]);
  },

  /**
   * getRawAbi of the contract
   * @function getRawAbi
   * @param {*} chain
   * @param {*} tokenScAddr
   */
  getRawAbi(chain, tokenScAddr) {
    return global.iWAN.call('getRawAbi', networkTimeout, [chain, tokenScAddr]);
  },

  /**
   * getRawCodeAndAbi of the contract
   * @function getRawCodeAndAbi
   * @param {*} chain
   * @param {*} tokenScAddr
   */
  getRawCodeAndAbi(chain, tokenScAddr) {
    return global.iWAN.call('getRawCodeAndAbi', networkTimeout, [chain, tokenScAddr]);
  },

  /**
   * Convert bin hex back into Abi json definition. abiBinToJson
   * @function getJson2Bin
   * @param {*} chain
   * @param {*} tokenScAddr
   * @param {*} action
   * @param {*} args
   */
  getJson2Bin(chain, tokenScAddr, action, args) {
    return global.iWAN.call('getJson2Bin', networkTimeout, [chain, tokenScAddr, action, args]);
  },

  /**
   * Receive the actions of the account
   * @function getActions
   * @param {*} chain
   * @param {*} address
   * @param {*} options
   *  v1 : indexPos, offset
   *  hyperion v2: options
   *  options.filter string? code::name filter 
   *  options.skip number? skip [n] actions (pagination)
   *  options.limit number? limit of [n] actions per page
   *  options.sort string? sort direction 
   *  options.after string? filter after specified date (ISO8601)
   *  options.before string? filter before specified date (ISO8601) 
   *  options.transfer_to string? transfer filter to 
   *  options.transfer_from string? transfer filter from 
   *  options.transfer_symbol string? transfer filter symbol 
   *  options.act_name string? act name 
   *  options.act_account string? act account
   */
  getActions(chain, address, options = {}) {
    let config = utils.getConfigSetting('sdk:config', undefined);
    if (config.network == 'testnet') {
      options.indexPos = -1;
      options.offset = -100;
      options.version = "v1";
    }
    return global.iWAN.call('getActions', networkTimeout, [chain, address, options]);
  },

  /**
   * get the currence cpu/ram/net of the account
   * @function
   * @param {*} chain
   */
  getResource(chain) {
    return global.iWAN.call('getResource', networkTimeout, [chain]);
  },

  /**
   * get the current price of the cpu/ram/net
   * @function getResourcePrice
   * @param {*} chain
   * @param {*} address
   */
  getResourcePrice(chain, address) {
    return global.iWAN.call('getResourcePrice', networkTimeout, [chain, address]);
  },

  /**
   * get the current price of the cpu/net
   * @function getBandwidthPrice
   * @param {*} chain
   * @param {*} address
   */
  getBandwidthPrice(chain, address) {
    return global.iWAN.call('getBandwidthPrice', networkTimeout, [chain, address]);
  },

  /**
   * get the current price of the ram
   * @function getRamPrice
   * @param {*} chain
   */
  getRamPrice(chain) {
    return global.iWAN.call('getRamPrice', networkTimeout, [chain]);
  },

  /**
   * get the current staked amount of the chain
   * @function getTotalStaked
   * @param {*} chain
   */
  getTotalStaked(chain) {
    return global.iWAN.call('getTotalStaked', networkTimeout, [chain]);
  },

  /**
   * get the total supply amount of the chain
   * @function getTotalSupply
   * @param {*} chain
   */
  getTotalSupply(chain) {
    return global.iWAN.call('getTotalSupply', networkTimeout, [chain]);
  },

  /**
   * get the current stake info of the chain, totalStaked, totalSup, percent
   * @function getTotalStakedPercent
   * @param {*} chain
   */
  getTotalStakedPercent(chain) {
    return global.iWAN.call('getTotalStakedPercent', networkTimeout, [chain]);
  },

  /**
   * get an object containing rows from the specified table
   * @function getTableRows
   * @param {*} chain
   */
  getTableRows(chain, scAddr, scope, table, options) {
    return global.iWAN.call('getTableRows', networkTimeout, [chain, scAddr, scope, table, options]);
  },

  /**
   * get an account stake detail info
   * @function getAccountStakeInfo
   * @param {*} chain
   */
  getAccountStakeInfo(chain, account) {
    return global.iWAN.call('getTableRows', networkTimeout, [chain, 'eosio', account, 'delband']);
  },

  /**
   * get an account stake detail info
   * @function getAccountStakeInfo
   * @param {*} chain
   */
  getAccountUnStakeInfo(chain, account) {
    return global.iWAN.call('getTableRows', networkTimeout, [chain, 'eosio', account, 'refunds']);
  },

  /**
   * pack the tran with acitons
   * @function getRamPrice
   * @param {*} chain
   * @param {*} transaction(Object)
   */
  async packTransaction(chain, transaction) {
    // return global.iWAN.call('packTransaction', networkTimeout, [chain, transaction]);
    let tryTimes = utils.getConfigSetting("sdk:config:tryTimes", 6);
    let result;
    for (let i = 0; i <= tryTimes; i++) {
      logger.debug("packTransaction exec for time", i);
      try {
        result = await global.iWAN.call('packTransaction', networkTimeout, [chain, transaction]);
        return (result);
      } catch (error) {
        if (i === tryTimes) {
          throw (new Error(error));
        } else {
          logger.warn("packTransaction failed for time", i, error);
        }
      }
    }
  },

  getTransByBlock(chain, blockNo) {
    return global.iWAN.call('getTransByBlock', networkTimeout, [chain, blockNo]);
  },

  getGasPrice(chain) {
    return global.iWAN.call('getGasPrice', networkTimeout, [chain]);
  },

  estimateGas(chain, txobj) {
    return global.iWAN.call('estimateGas', networkTimeout, [chain, txobj]);
  },

  getIWanRpc() {
    return global.iWAN;
  },
  /**
   * Get iWAN instance
   */
  getIWanInstance() {
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

  getSlotActivity(chain, epochID) {
    return global.iWAN.call('getSlotActivity', networkTimeout, [chain, epochID]);
  },

  getValidatorActivity(chain, epochID) {
    return global.iWAN.call('getValidatorActivity', networkTimeout, [chain, epochID]);
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

  getRegisteredDapp(options) {
    return global.iWAN.call('getRegisteredDapp', networkTimeout, [options]);
  },

  getRegisteredAds(options) {
    return global.iWAN.call('getRegisteredAds', networkTimeout, [options]);
  },

  getMaxBlockNumber(chain, epochID) {
    return global.iWAN.call('getMaxBlockNumber', networkTimeout, [chain, epochID]);
  },

  getValidatorSupStakeInfo(chain, address, options) {
    return global.iWAN.call('getValidatorSupStakeInfo', networkTimeout, [chain, address, options]);
  },

  getDelegatorSupStakeInfo(chain, address, options) {
    return global.iWAN.call('getDelegatorSupStakeInfo', networkTimeout, [chain, address, options]);
  },

  getEpochIncentiveBlockNumber(chain, epochID) {
    return global.iWAN.call('getEpochIncentiveBlockNumber', networkTimeout, [chain, epochID]);
  },

  getEpochStakeOut(chain, epochID) {
    return global.iWAN.call('getEpochStakeOut', networkTimeout, [chain, epochID]);
  },

  getRegisteredOrigToken(chainType, options) {
    return global.iWAN.call('getRegisteredOrigToken', networkTimeout, [chainType, options]);
  },

  getRegisteredMapToken(chainType, options) {
    return global.iWAN.call('getRegisteredMapToken', networkTimeout, [chainType, options]);
  },

  /**
   * ========================================================================
   * Open storeman relative api
   * ========================================================================
  */

  getOpenStoremanGroupList(options = {}) {
    return global.iWAN.call('getStoremanGroupList', networkTimeout, [options]);
  },

  async getReadyOpenStoremanGroupList(options = {}) {
    let storemanGroupList = await global.iWAN.call('getStoremanGroupList', networkTimeout, [options]);
    let self = this;

    if (Array.isArray(storemanGroupList) && storemanGroupList.length > 0) {
      let readyStoremanGroupList = [];
      let freshStoremanGroups = storemanGroupList.map(async function(storemanGroup) {
        let groupStatus = await self.getStoremanGroupStatus('ETH', storemanGroup.groupId);
        if (Number(groupStatus[0]) === 5 && Number(storemanGroup.status) === 5 && Number(storemanGroup.startTime) * 1000 <= Date.now() && Date.now() <= Number(storemanGroup.endTime) * 1000 ){
          readyStoremanGroupList.push(storemanGroup);
        } 
      })
      await Promise.all(freshStoremanGroups);
      return readyStoremanGroupList;
    } else {
      return [];
    }
  },

  getStoremanGroupStatus(chainType, storemanGroupID) {
    let config = utils.getConfigSetting('sdk:config', undefined);
    let scAddr = config.crossChainScDict[chainType].CONTRACT.oracleAddr;
    let abi = config.crossChainScDict[chainType].CONTRACT.oracleAbi;
    let func = 'getStoremanGroupStatus';
    let version = 'v2';

    return global.iWAN.call('callScFunc', networkTimeout, [chainType, scAddr, func, [storemanGroupID], abi]);
  },

  getStoremanGroupActivity(groupId) {
    return global.iWAN.call('getStoremanGroupActivity', networkTimeout, [groupId]);
  },

  getStoremanGroupInfo(groupId) {
    return global.iWAN.call('getStoremanGroupInfo', networkTimeout, [groupId]);
  },

  getMultiStoremanGroupInfo(groupIdArray) {
    return global.iWAN.call('getMultiStoremanGroupInfo', networkTimeout, [groupIdArray]);
  },

  getStoremanGroupConfig(groupId) {
    return global.iWAN.call('getStoremanGroupConfig', networkTimeout, [groupId]);
  },

  getSelectedStoreman(options = {}) {
    return global.iWAN.call('getSelectedStoreman', networkTimeout, [options]);
  },

  getStoremanInfo(wkAddr) {
    return global.iWAN.call('getStoremanInfo', networkTimeout, [wkAddr]);
  },

  getMultiStoremanInfo(wkAddrArray) {
    return global.iWAN.call('getMultiStoremanInfo', networkTimeout, [wkAddrArray]);
  },

  getStoremanCandidates(groupId) {
    return global.iWAN.call('getStoremanCandidates', networkTimeout, [groupId]);
  },

  getStoremanGroupMember(groupId) {
    return global.iWAN.call('getStoremanGroupMember', networkTimeout, [groupId]);
  },

  getStoremanStakeInfo(address, wkAddr, groupId) {
    return global.iWAN.call('getStoremanStakeInfo', networkTimeout, [{ 'address': address, 'wkAddr': wkAddr, 'groupId': groupId }]);
  },

  getStoremanStakeTotalIncentive(address, wkAddr, fromBlock, toBlock) {
    return global.iWAN.call('getStoremanStakeTotalIncentive', networkTimeout, [{ 'address': address, 'wkAddr': wkAddr, 'fromBlock': fromBlock, 'toBlock': toBlock }]);
  },

  getStoremanDelegatorInfo(address, wkAddr) {
    return global.iWAN.call('getStoremanDelegatorInfo', networkTimeout, [{ 'address': address, 'wkAddr': wkAddr }]);
  },

  getStoremanDelegatorTotalIncentive(address, wkAddr, fromBlock, toBlock) {
    return global.iWAN.call('getStoremanDelegatorTotalIncentive', networkTimeout, [{ 'address': address, 'wkAddr': wkAddr, 'fromBlock': fromBlock, 'toBlock': toBlock }]);
  },

  getStoremanConf() {
    return global.iWAN.call('getStoremanConf', networkTimeout, []);
  },

  getStoremanGpkSlashInfo(address, wkAddr, fromBlock, toBlock) {
    return global.iWAN.call('getStoremanGpkSlashInfo', networkTimeout, [{ 'address': address, 'wkAddr': wkAddr, 'fromBlock': fromBlock, 'toBlock': toBlock }]);
  },

  getStoremanSignSlashInfo(address, wkAddr, fromBlock, toBlock) {
    return global.iWAN.call('getStoremanSignSlashInfo', networkTimeout, [{ 'address': address, 'wkAddr': wkAddr, 'fromBlock': fromBlock, 'toBlock': toBlock }]);
  },

  getRewardRatio() {
    return global.iWAN.call('getRewardRatio', networkTimeout, []);
  },

  multiCall(chainType, calls) {
    return global.iWAN.call('multiCall', networkTimeout, [chainType, calls]);
  },

  async getTokenInfosFromMulticall(tokenPairs) {
    let config = utils.getConfigSetting('sdk:config', undefined);

    let wanCalls = [];
    let ethCalls = [];
    let otherFrom = [];
    let otherTo = [];

    tokenPairs.map(function (tokenPair, i) {
      if (tokenPair.fromAccount !== config.coinAddress && tokenPair.fromChainID !== '2147483709') {
        if (tokenPair.fromChainSymbol === 'ETH') {
          // MKR mainnet and testnet are ignored.
          if (tokenPair.fromAccount === '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2' || tokenPair.fromAccount === '0x54950025d1854808b09277fe082b54682b11a50b') {
            tokenPair.fromTokenSymbol = "MKR";
            tokenPair.fromTokenName = "MKR";
          } else if (tokenPair.fromAccount === '0x0000000000085d4780b73119b644ae5ecd22b376' || tokenPair.fromAccount === '0xe78f31a33435dd8a43d1c57ae5c89f786369ab35') {
            tokenPair.fromTokenSymbol = "TUSD";
            tokenPair.fromTokenName = "TUSD";
          } else {
            ethCalls.push({
              target: tokenPair.fromAccount,
              call: ['symbol()(string)'],
              returns: [['fromTokenSymbol_' + i]]
            });
            ethCalls.push({
              target: tokenPair.fromAccount,
              call: ['name()(string)'],
              returns: [['fromTokenName_' + i]]
            });
          }
        } else if (tokenPair.fromChainSymbol === 'WAN') {
          wanCalls.push({
            target: tokenPair.fromAccount,
            call: ['symbol()(string)'],
            returns: [['fromTokenSymbol_' + i]]
          });
          wanCalls.push({
            target: tokenPair.fromAccount,
            call: ['name()(string)'],
            returns: [['fromTokenName_' + i]]
          });
        } else {
          otherFrom.push({
            chainType: tokenPair.fromChainSymbol,
            address: tokenPair.fromAccount,
            index: i,
          });
        }
      } 

      if (tokenPair.toAccount !== config.coinAddress && tokenPair.toChainID !== '2147483709') {
        if (tokenPair.toChainSymbol === 'ETH') {
          // MKR mainnet and testnet are ignored.
          if (tokenPair.toAccount === '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2' || tokenPair.toAccount === '0x54950025d1854808b09277fe082b54682b11a50b') {
            tokenPair.toTokenSymbol = "MKR";
            tokenPair.toTokenName = "MKR";
          } else if (tokenPair.toAccount === '0x0000000000085d4780b73119b644ae5ecd22b376' || tokenPair.toAccount === '0xe78f31a33435dd8a43d1c57ae5c89f786369ab35') {
            tokenPair.toTokenSymbol = "TUSD";
            tokenPair.toTokenName = "TUSD";
          } else {
            ethCalls.push({
              target: tokenPair.toAccount,
              call: ['symbol()(string)'],
              returns: [['toTokenSymbol_' + i]]
            });
            ethCalls.push({
              target: tokenPair.toAccount,
              call: ['name()(string)'],
              returns: [['toTokenName_' + i]]
            });
          }
        } else if (tokenPair.toChainSymbol === 'WAN') {
          wanCalls.push({
            target: tokenPair.toAccount,
            call: ['symbol()(string)'],
            returns: [['toTokenSymbol_' + i]]
          });
          wanCalls.push({
            target: tokenPair.toAccount,
            call: ['name()(string)'],
            returns: [['toTokenName_' + i]]
          });
        } else {
          otherTo.push({
            chainType: tokenPair.toChainSymbol,
            address: tokenPair.toAccount,
            index: i,
          });
        }
      }
    });

    console.time('multiCall');
    let arrayWait = [this.multiCall('WAN', wanCalls), this.multiCall('ETH', ethCalls)];
    let wanRet;
    let ethRet;
    [wanRet, ethRet] = await Promise.all(arrayWait);
    console.timeEnd('multiCall');

    for (const key in wanRet.results.transformed) {
      let sp = key.split('_');
      tokenPairs[sp[1]][sp[0]] = wanRet.results.transformed[key];
    }

    for (const key in ethRet.results.transformed) {
      let sp = key.split('_');
      tokenPairs[sp[1]][sp[0]] = ethRet.results.transformed[key];
    }

    for (let i=0; i<otherFrom.length; i++) {
      let info = await this.getTokenInfo(otherFrom[i].address, otherFrom[i].chainType);
      tokenPairs[otherFrom[i].index].fromTokenSymbol = info.symbol;
      tokenPairs[otherFrom[i].index].fromTokenName = info.name;
    }

    for (let i=0; i<otherTo.length; i++) {
      let info = await this.getTokenInfo(otherTo[i].address, otherTo[i].chainType);
      tokenPairs[otherTo[i].index].toTokenSymbol = info.symbol;
      tokenPairs[otherTo[i].index].toTokenName = info.name;
    }

    tokenPairs.map((tokenPair) => {
      /* Workaround: WBTC to wanBTC, EOS to wanEOS on Wanchain */
      if (tokenPair.fromTokenSymbol == "WBTC") {
        tokenPair.fromTokenSymbol = 'wanBTC';
        tokenPair.fromTokenName = 'wanBTC@Wanchain';
      } else if (tokenPair.toTokenSymbol == "WBTC") {
        tokenPair.toTokenSymbol = 'wanBTC';
        tokenPair.toTokenName = 'wanBTC@Wanchain';
      } else if (tokenPair.fromTokenSymbol == "EOS" && tokenPair.fromChainID == "2153201998") {
        tokenPair.fromTokenSymbol = 'wanEOS';
        tokenPair.fromTokenName = 'wanEOS@Wanchain';
      } else if (tokenPair.toTokenSymbol == "EOS" && tokenPair.toChainID == "2153201998") {
        tokenPair.toTokenSymbol = 'wanEOS';
        tokenPair.toTokenName = 'wanEOS@Wanchain';
      }
    })

    return tokenPairs;
  },

  async getTokenPairs(options) {
    console.log('getTokenPairs called');
    if (!options && global.tokenPairs) {
      return global.tokenPairs;
    }

    let config = utils.getConfigSetting('sdk:config', undefined);
    let wanBtcAccount = config.wbtcTokenAddress;

    // TODO
    let defaultTokenPairs = [];
    // let defaultTokenPairs = [
    //   {
    //     "id": "1024",
    //     "ancestorDecimals": "8",
    //     "ancestorSymbol": "BTC",
    //     "decimals": "8",
    //     "fromAccount": config.coinAddress,
    //     "fromChainID": "2147483648",
    //     "fromChainName": "Bitcoin",
    //     "fromChainSymbol": "BTC",
    //     "fromTokenName": "Bitcoin",
    //     "fromTokenSymbol": "BTC",
    //     "toAccount": wanBtcAccount,
    //     "toChainID": "2153201998",
    //     "toChainName": "Wanchain",
    //     "toChainSymbol": "WAN",
    //     "toTokenName": "wanBTC@wanchain",
    //     "toTokenSymbol": "wanBTC"
    //   }
    // ];

    let eosTokens = await ccUtil.getRegTokensFromRPC('EOS');
    if (config.network === 'testnet') {
      eosTokens = [{
        tokenOrigAccount: '0x01800000c2656f73696f2e746f6b656e3a454f53',
        ratio: '20',
        minDeposit: '10000000000000000000',
        withdrawDelayTime: '3600',
        name: 'EOS',
        symbol: 'EOS',
        decimals: '4',
        tokenWanAddr: '0x57195b9d12421e963b720020483f97bb7ff2e2a6'
      },
      {
        tokenOrigAccount: '0x01800000c265646372667674676279686e3a4e53',
        ratio: '1',
        minDeposit: '10000000000000000000',
        withdrawDelayTime: '3600',
        name: 'NS',
        symbol: 'NS',
        decimals: '0',
        tokenWanAddr: '0x6c7deeb144436c776be6b2b9e6334a860e8d6c8e'
      }]
    } else {
      eosTokens = [{
        tokenOrigAccount: '0x01800000c2656f73696f2e746f6b656e3a454f53',
        ratio: '190000',
        minDeposit: '10000000000000000000',
        withdrawDelayTime: '259200',
        name: 'Wanchain EOS Crosschain Token',
        symbol: 'EOS',
        decimals: '4',
        tokenWanAddr: '0x81862b7622ced0defb652addd4e0c110205b0040'
      }];
    }

    for(let token of eosTokens){
      defaultTokenPairs.push({
        "id": (token.symbol === 'EOS') ? "1025" : "1026",
        "ancestorDecimals": token.decimals,
        "ancestorSymbol": token.symbol,
        "decimals": token.decimals,
        "fromAccount": ccUtil.decodeAccount('EOS', token.tokenOrigAccount),
        "fromChainID": "2147483842",
        "fromChainName": "EOS",
        "fromChainSymbol": "EOS",
        "fromTokenName": "EOS",
        "fromTokenSymbol": token.symbol,
        "toAccount": token.tokenWanAddr,
        "toChainID": "2153201998",
        "toChainName": "Wanchain",
        "toChainSymbol": "WAN",
        "toTokenName": "wan" + token.symbol + "@wanchain",
        "toTokenSymbol": "wan" + token.symbol
      })
    }

    let tokenPairs = await global.iWAN.call('getTokenPairs', networkTimeout, [options]);
    let self = this;

    let chainInfoCache = {};

    const getChainInfoCache = async (chainId) => {
      if (chainInfoCache.getChainInfoByChainId && chainInfoCache.getChainInfoByChainId[chainId]) {
        return chainInfoCache.getChainInfoByChainId[chainId];
      } 
      if (!chainInfoCache.getChainInfoByChainId) {
        chainInfoCache.getChainInfoByChainId = {};
      }
      chainInfoCache.getChainInfoByChainId[chainId] = await self.getChainInfoByChainId(chainId);
      return chainInfoCache.getChainInfoByChainId[chainId];
    }

    let freshTokenPairs = tokenPairs.map(async function (tokenPair) {
      tokenPair.decimals = tokenPair.ancestorDecimals;
      let fromChain = (await getChainInfoCache(tokenPair.fromChainID));
      let toChain = (await getChainInfoCache(tokenPair.toChainID));
      tokenPair.fromChainSymbol = fromChain[1];
      tokenPair.fromChainName = fromChain[2];
      tokenPair.toChainSymbol = toChain[1];
      tokenPair.toChainName = toChain[2];
      if (tokenPair.fromAccount === config.coinAddress || tokenPair.fromChainID === '2147483709') {
        tokenPair.fromTokenSymbol = tokenPair.ancestorSymbol;
        tokenPair.fromTokenName = tokenPair.ancestorSymbol;
      } 
      if (tokenPair.toAccount === config.coinAddress || tokenPair.toChainID === '2147483709') {
        tokenPair.toTokenSymbol = tokenPair.ancestorSymbol;
        tokenPair.toTokenName = tokenPair.ancestorSymbol;
      }
    })
    await Promise.all(freshTokenPairs);

    tokenPairs = await this.getTokenInfosFromMulticall(tokenPairs);

    global.tokenPairs = defaultTokenPairs.concat(tokenPairs);
    return global.tokenPairs;
  },

  getTokenPairIDs(options) {
    return global.iWAN.call('getTokenPairIDs', networkTimeout, [options]);
  },

  getTokenPairInfo(pairId) {
    return global.iWAN.call('getTokenPairInfo', networkTimeout, [pairId]);
  },

  getTokenPairAncestorInfo(pairId) {
    return global.iWAN.call('getTokenPairAncestorInfo', networkTimeout, [pairId]);
  },

  getChainConstantInfo(options) {
    return global.iWAN.call('getChainConstantInfo', networkTimeout, [options]);
  },

  getChainInfoByChainId(chainId) {
    return global.iWAN.call('getChainConstantInfo', networkTimeout, [{ "chainId": chainId }]);
  },

  getFees(chainType, chainID1, chainID2) {
    let config = utils.getConfigSetting('sdk:config', undefined);
    let scAddr = config.crossChainScDict[chainType].CONTRACT.crossScAddr;
    let abi = config.crossChainScDict[chainType].CONTRACT.crossScAbi;
    let func = 'getFees';
    let version = 'v2';

    return global.iWAN.call('callScFunc', networkTimeout, [chainType, scAddr, func, [Number(chainID1), Number(chainID2)], abi]);
  },

  getMintQuota(chainType, tokenPairID, storemanGroupID) {
    let config = utils.getConfigSetting('sdk:config', undefined);
    let scAddr = config.crossChainScDict[chainType].CONTRACT.quotaAddr;
    let abi = config.crossChainScDict[chainType].CONTRACT.quotaAbi;
    let func = 'getUserMintQuota';
    let version = 'v2';

    return global.iWAN.call('callScFunc', networkTimeout, [chainType, scAddr, func, [tokenPairID, storemanGroupID], abi]);
  },

  getBurnQuota(chainType, tokenPairID, storemanGroupID) {
    let config = utils.getConfigSetting('sdk:config', undefined);
    let scAddr = config.crossChainScDict[chainType].CONTRACT.quotaAddr;
    let abi = config.crossChainScDict[chainType].CONTRACT.quotaAbi;
    let func = 'getUserBurnQuota';
    let version = 'v2';

    return global.iWAN.call('callScFunc', networkTimeout, [chainType, scAddr, func, [tokenPairID, storemanGroupID], abi]);
  },

  checkCanStakeClaim(chainType, wkAddr) {
    let config = utils.getConfigSetting('sdk:config', undefined);
    let scAddr = config.crossChainSmgScDict.CONTRACT.smgAdminAddr;
    let abi = config.crossChainSmgScDict.CONTRACT.smgAdminAbi;
    let func = 'checkCanStakeClaim';
    let version = 'v2';

    return global.iWAN.call('callScFunc', networkTimeout, [chainType, scAddr, func, [wkAddr], abi, version]);
  },

  // getFastMinCount return (fastCrossMinValue, symbol, decimals, price, count);
  getFastMinCount(chainType, tokenPairID) {
    let config = utils.getConfigSetting('sdk:config', undefined);
    let scAddr = config.crossChainScDict[chainType].CONTRACT.quotaAddr;
    let abi = config.crossChainScDict[chainType].CONTRACT.quotaAbi;
    let func = 'getFastMinCount';
    let version = 'v2';
    let self = this;

    return new Promise(async function (resolve, reject) {
      try {
        let result = await global.iWAN.call('callScFunc', networkTimeout, [chainType, scAddr, func, [parseInt(tokenPairID)], abi]);
        let count = result[4];
        let decimals = result[2];

        resolve(self.weiToToken(count, decimals));
      } catch (err) {
        reject(err);
      }
    });
  },

  async getBtcLockAccount(groupId) {
    let storemanGroup = await this.getStoremanGroupConfig(groupId);
    let btcCurveId = 0;
    let storemanPk = (btcCurveId === Number(storemanGroup.curve1)) ? storemanGroup.gpk1 : storemanGroup.gpk2;
    let pubkey = '04' + this.hexTrip0x(storemanPk);
    return btcUtil.getAddressbyPublicKey(pubkey);
  },

  getOpReturnOutputs(chainType, options) {
    return global.iWAN.call('getOpReturnOutputs', networkTimeout, [chainType, options]);
  },

  getStoremanGroupQuota(chainType, groupId, symbolArray) {
    return global.iWAN.call('getStoremanGroupQuota', networkTimeout, [chainType, groupId, symbolArray]);
  },

  estimateNetworkFee(chainType, feeType, options) {
    return global.iWAN.call('estimateNetworkFee', networkTimeout, [chainType, feeType, options]);
  },

  getEstimateNetworkFee(chainType, feeRate, mode) {
    // mergeFee according to the follow tran, 2 vin and 1 vout, https://tbtc.bitaps.com/35f62fa74a4d7baaaaca35cc7bcff201a439d5f3de2dca1bbb0f7ca2b68c23eb
    // releaseFee accroding to the follow tran, 1 vin and 3 vout(op_return), https://tbtc.bitaps.com/1fc9ff8fe0ef1e52d2517d81f38ba0ef355043bb0734915dd30531c4ff2dc416
    let smgMergeFeeSize = 462;
    let smgReleaseFeeSize = 303;
    let fee;
    if (mode === 'Lock') {
      fee = smgMergeFeeSize * feeRate;
    } else if (mode === 'Release') {
      fee = smgReleaseFeeSize * feeRate;
    }
    return fee;
  },
  /**
   * ========================================================================
   * Private transaction
   * ========================================================================
   */
  getOtaFunds(wid, path, excludeRefund) {
    if (typeof wid !== 'number' || typeof path !== 'string') {
      throw new error.InvalidParameter("Invalid paramter wid and/or path");
    }

    excludeRefund = excludeRefund || true;

    let myAddr = utils.compositeWalletKey(wid, path);

    let f = function (r) {
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
  generatePubkeyIWQforRing(Pubs, I, w, q) {
    let length = Pubs.length;
    let sPubs = [];
    for (let i = 0; i < length; i++) {
      sPubs.push(Pubs[i].toString('hex'));
    }
    let ssPubs = sPubs.join('&');
    let ssI = I.toString('hex');
    let sw = [];
    for (let i = 0; i < length; i++) {
      sw.push('0x' + w[i].toString('hex').replace(/(^0*)/g, ""));
    }
    let ssw = sw.join('&');
    let sq = [];
    for (let i = 0; i < length; i++) {
      sq.push('0x' + q[i].toString('hex').replace(/(^0*)/g, ""));
    }
    let ssq = sq.join('&');

    let KWQ = [ssPubs, ssI, ssw, ssq].join('+');
    return KWQ;
  }

}
module.exports = ccUtil;
