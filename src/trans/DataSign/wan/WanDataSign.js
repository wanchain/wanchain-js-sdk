'use strict'

let errorHandle = require('../../transUtil').errorHandle;
let retResult = require('../../transUtil').retResult;
let DataSign = require('../common/DataSign');

let KeystoreDir = require('../../../keystore').KeystoreDir;
let wanUtil = require('wanchain-util');
let wanchainTx = wanUtil.wanchainTx;


class WanDataSign extends DataSign {
  constructor(input, config) {
    super(input, config);
  }

  getPrivateKey(chainType, address, password) {
    let keystoreDir = new KeystoreDir(config[chainType].keystoreDir);
    let Account = keystoreDir.getAccount(address);
    let privateKey = Account.getPrivateKey(password);
    return privateKey;
  }

  sign(tran) {
    console.log("Entering WanDataSign::sign");
    let config = this.config;

    let privateKey = getPrivateKey('WAN', trans.commondData.from, input.password);


    let trans = tran.commondData;
    trans.data = tran.contractData;

    let rawTx = signByPrivateKey(trans, privateKey);

    retResult.code = true;
    retResult.result = rawTx;
    return retResult;
  }

  signFunc(trans, privateKey, TxClass) {
    const tx = new TxClass(trans);
    tx.sign(privateKey);
    const serializedTx = tx.serialize();
    return "0x" + serializedTx.toString('hex');
  }

  signByPrivateKey(trans, privateKey) {
    return signFunc(trans, privateKey, wanchainTx);
  }

}

module.exports = EthDataSign;