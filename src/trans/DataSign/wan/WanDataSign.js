'use strict'

let     retResult   = require('../../transUtil').retResult;
let     DataSign    = require('../common/DataSign');
let     ccUtil      = require('../../../api/ccUtil');

class WanDataSign extends DataSign {
  constructor(input, config) {
    super(input, config);
  }

  sign(tran) {
    global.logger.debug("Entering WanDataSign::sign");
    global.logger.debug(tran);
    //
    // global.logger.debug(this.input);
    // global.logger.debug(this.config);

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