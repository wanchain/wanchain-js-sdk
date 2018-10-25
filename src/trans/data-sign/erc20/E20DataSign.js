'use strict'
let     retResult   = require('../../transUtil').retResult;
let     DataSign    = require('../common/DataSign');
let     ccUtil      = require('../../../api/ccUtil');

/**
 * class use to sign transaction
 * @class
 * @augments  DataSign
 *
 */
class EthDataSign extends DataSign {
  /**
   * @constructor
   * @param {Object} input  - {@link CrossChain#input input}
   * @param {Object} config - {@link CrossChain#config config}
   */
  constructor(input, config) {
    super(input, config);
  }

  /**
   * sign data
   * @override
   * @param tran
   * @returns {{code: boolean, result: null}|transUtil.retResult|{code, result}}
   */
  sign(tran) {
    global.logger.debug("Entering EthDataSign::sign");
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