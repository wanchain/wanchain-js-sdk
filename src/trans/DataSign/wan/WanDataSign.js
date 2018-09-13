'use strict'

let     retResult   = require('../../transUtil').retResult;
let     DataSign    = require('../common/DataSign');
let     ccUtil      = require('../../../api/ccUtil');

class WanDataSign extends DataSign {
  constructor(input, config) {
    super(input, config);
  }

  sign(tran) {
    console.log("Entering WanDataSign::sign");
    console.log("&&&&&&&&&&&&&&&&&&&&&");
    console.log(tran);
    //
    // console.log(this.input);
    // console.log(this.config);

    let privateKey = ccUtil.getPrivateKey(
      tran.commonData.from,
      this.input.password,
      this.config.srcKeystorePath);
    let trans = tran.commonData;
    trans.data = tran.contractData;

    let rawTx = ccUtil.signWanByPrivateKey(trans, privateKey);

    retResult.code = true;
    retResult.result = rawTx;
    return retResult;
  }
}

module.exports = WanDataSign;