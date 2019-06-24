'use strict'
let     errorHandle   = require('../../transUtil').errorHandle;
let     retResult     = require('../../transUtil').retResult;
let     utils         = require('../../../util/util');

let logger = utils.getLogger('Transaction.js');

/**
 * @class
 *
 */
class Transaction {
  /**
   * @constructor
   * @param {Object} input  - {@link CrossChain#input input} of final users.(gas, gasPrice, value and so on)
   * @param {Object} config - {@link CrossChain#config config} of cross chain used.
   */
  constructor(input,config) {
    this.input          = input;
    this.config         = config;

    this.commonData     = null;
    this.contractData   = null;

    let self = this;
    self.retResult = {};
    Object.assign(self.retResult,retResult);
  }

  /**
   * set common data.
   * @param commonData
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  setCommonData(commonData){
    logger.debug("Entering Transaction::setCommonData");
    this.commonData     = commonData;
    this.retResult.code      = true;
    return this.retResult;
  }

  /**
   * set contract data
   * @param contractData
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  setContractData(contractData){
    logger.debug("Entering Transaction::setContractData");
    this.contractData     = contractData;
    this.commonData.data  = contractData;
    this.retResult.code        = true;
    return this.retResult;
  }
}

module.exports = Transaction;
