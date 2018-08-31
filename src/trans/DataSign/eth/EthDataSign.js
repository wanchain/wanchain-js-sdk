'use strict'

let     errorHandle = require('../../transUtil').errorHandle;
let     retResult   = require('../../transUtil').retResult;
let     DataSign    = require('../common/DataSign');
let     KeystoreDir = require('../../../keystore').KeystoreDir;
let     ethTx       = require('ethereumjs-tx');


class EthDataSign extends DataSign {
  constructor(input, config) {
    super(input, config);
  }

  getPrivateKey(chainType, address, password) {
    let keystoreDir = new KeystoreDir(this.config[chainType].keystoreDir);
    let account = keystoreDir.getAccount(address);
    let privateKey = account.getPrivateKey(password);
    return privateKey;
  }

  sign(tran) {
    console.log("Entering EthDataSign::sign");
    let config = this.config;

    let privateKey = getPrivateKey('ETH', tran.commondData.from, input.password);

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
    return signFunc(trans, privateKey, ethTx);
  }


}

module.exports = EthDataSign;