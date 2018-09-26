'use strict'
let     retResult   = require('../../transUtil').retResult;
let     DataSign    = require('../common/DataSign');
let     ccUtil      = require('../../../api/ccUtil');


class EthDataSign extends DataSign {
  constructor(input, config) {
    super(input, config);
  }


  sign(tran) {
    global.logger.debug("Entering EthDataSign::sign");
    global.logger.debug(tran);

    let privateKey = ccUtil.getPrivateKey(
      tran.commonData.from,
      this.input.password,
      this.input.keystorePath);
    let trans = tran.commonData;
    trans.data = tran.contractData;

    let rawTx = ccUtil.signEthByPrivateKey(trans, privateKey);

    retResult.code = true;
    retResult.result = rawTx;
    return retResult;
  }


}

module.exports = EthDataSign;