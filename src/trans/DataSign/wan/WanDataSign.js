'use strict'

let     retResult   = require('../../transUtil').retResult;
let     DataSign    = require('../common/DataSign');


class WanDataSign extends DataSign {
  constructor(input, config) {
    super(input, config);
  }

  sign(tran) {
    console.log("Entering WanDataSign::sign");
    let privateKey = ccUtil.getPrivateKey('WAN',
      tran.commondData.from,
      this.input.password,
      this.config.wanKeyStorePath);
    let trans = tran.commondData;
    trans.data = tran.contractData;

    let rawTx = signWanByPrivateKey(trans, privateKey);

    retResult.code = true;
    retResult.result = rawTx;
    return retResult;
  }
}

module.exports = WanDataSign;