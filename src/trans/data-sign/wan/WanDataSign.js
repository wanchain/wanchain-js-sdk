'use strict'

let DataSign = require('../common/DataSign');
let ccUtil   = require('../../../api/ccUtil');
/**
 * @class
 * @augments DataSign
 */
class WanDataSign extends DataSign {
  /**
   * @constructor
   * @param {Object} input  - {@link CrossChain#input input} of final users.(gas, gasPrice, value and so on)
   * @param {Object} config - {@link CrossChain#config config} of cross chain used.
   */
  constructor(input, config) {
    super(input, config);
  }

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  sign(tran) {
    global.logger.debug("Entering WanDataSign::sign");

    let privateKey = ccUtil.getPrivateKey(
      tran.commonData.from,
      this.input.password,
      this.input.keystorePath);
    let trans = tran.commonData;
    trans.data = tran.contractData;

    let rawTx = ccUtil.signWanByPrivateKey(trans, privateKey);

    this.retResult.code = true;
    this.retResult.result = rawTx;
    return this.retResult;
  }
}

module.exports = WanDataSign;
