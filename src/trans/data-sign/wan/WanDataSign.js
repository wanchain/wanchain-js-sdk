'use strict'

let     retResult   = require('../../transUtil').retResult;
let     DataSign    = require('../common/DataSign');
let     ccUtil      = require('../../../api/ccUtil');
/**
 * @class
 * @augments DataSign
 */
class WanDataSign extends DataSign {
  /**
   * @constructor
   * @param {Object} input  - {@link CrossChain#input input}
   * @param {Object} config - {@link CrossChain#config config}
   */
  constructor(input, config) {
    super(input, config);
  }

  /**
   * @override
   * @param tran
   * @returns {{code: boolean, result: null}|transUtil.retResult|{code, result}}
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

    retResult.code = true;
    retResult.result = rawTx;
    return retResult;
  }
}

module.exports = WanDataSign;