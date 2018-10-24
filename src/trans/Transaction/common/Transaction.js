'use strict'
let     errorHandle   = require('../../transUtil').errorHandle;
let     retResult     = require('../../transUtil').retResult;

/**
 * @class
 *
 */
class Transaction {
  /**
   * @constructor
   * @param {Object} input  - {@link CrossChain#input input}
   * @param {Object} config - {@link CrossChain#config config}
   */
  constructor(input,config) {
    this.input          = input;
    this.config         = config;

    this.commonData     = null;
    this.contractData   = null;
  }

  /**
   * set common data.
   * @param commonData
   * @returns {{code: boolean, result: null}|transUtil.retResult|{code, result}}
   */
  setCommonData(commonData){
    global.logger.debug("Entering Transaction::setCommonData");
    this.commonData     = commonData;
    retResult.code      = true;
    return retResult;
  }

  /**
   * set contract data
   * @param contractData
   * @returns {{code: boolean, result: null}|transUtil.retResult|{code, result}}
   */
  setContractData(contractData){
    global.logger.debug("Entering Transaction::setContractData");
    this.contractData     = contractData;
    this.commonData.data  = contractData;
    retResult.code        = true;
    return retResult;
  }
}

module.exports = Transaction;
