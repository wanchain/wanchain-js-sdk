'use strict'

const config = require('./config')

class crossChainAccount {
  constructor(originChain, accountFormat = "", accountPrefix = "") {
    this.valid = false;
    // chain
    let chain = crossChainAccount.chainMap.get(originChain);
    if (chain) {
      this.version = (Array(1).fill('0').join("") + chain.version.toString(16)).slice(-2);
      this.chain = (Array(7).fill('0').join("") + chain.id.toString(16)).slice(-8);
    
      this.format = accountFormat ? accountFormat : chain.accountFormat;
      this.prefix = accountPrefix ? accountPrefix : chain.accountPrefix;
    } else {
      // console.error("invalid original chain");
      return;
    }
    // format
    if (!crossChainAccount.formatSet.has(this.format)) {
      console.error("invalid account format");
      return;
    }
    this.valid = true;
  }

  encodeAccount(originAccount) {
    // return originAccount;
    if (!(this.valid && originAccount)) {
      // return null;
      return originAccount;
    }
    if (this.prefix) {
      originAccount = originAccount.replace(new RegExp(this.prefix, 'i'), "");
    }
    let accountHex;
    if (this.format === "ascii") {
      accountHex = Buffer.from(originAccount, 'ascii').toString('hex');
    } else if (this.format === "hex") {
      accountHex = originAccount.toLowerCase();
    }
    return "0x" + this.version + this.chain + accountHex;
  }

  decodeAccount(wAccount) {
    // return {account: wAccount};
    if (!(this.valid && wAccount)) {
      // return null;
      return {account: wAccount};
    }
    wAccount = wAccount.replace(/0x/i, "");
    if (wAccount.length <= 6) { // header at least contain version(1byte) + chain(2bytes)
      console.error("invalid account");
      return null;
    }
    let version = parseInt(wAccount.slice(0, 2), 16);
    let chainValue = parseInt(wAccount.slice(2, 10), 16);
    let chain = crossChainAccount.chainMapReverse.get(chainValue);
    if ((!chain) || (chain.version != version)) {
      console.error("invalid chain or version");
      return null;
    }
    let account = wAccount.slice(10);
    if (this.format === "ascii") {
      account = Buffer.from(account, 'hex').toString('ascii');
    } else if (this.format === "hex") {
      account = account.toLowerCase();
    }
    if (this.prefix) {
      account = this.prefix + account;
    }
    return {version: version, chain: chain.name, account: account}
  }
};

crossChainAccount.chainMap = config.chainMap;
crossChainAccount.formatSet = config.formatSet;
crossChainAccount.chainMapReverse = (function() {
  let rMap = new Map();
  for (var [key, value] of crossChainAccount.chainMap) {
    rMap.set(value.id, {name: key, version: value.version});
  }
  return rMap;
})();

module.exports = crossChainAccount;