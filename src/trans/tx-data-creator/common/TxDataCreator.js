'use strict'
let     errorHandle   = require('../../transUtil').errorHandle;
let     retResult     = require('../../transUtil').retResult;

/**
 * @class
 *
 */
class TxDataCreator {
  /**
   * @constructor
   * @param {Object} input  - {@link CrossChain#input input} of final users.(gas, gasPrice, value and so on)
   * @param {Object} config - {@link CrossChain#config config} of cross chain used.
   */
  constructor(input,config) {
    this.input          = input;
    this.config         = config;

    let self = this;
    self.retResult = {};
    Object.assign(self.retResult,retResult);
  }

  /**
   * Build common data
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  createCommonData(){
    this.retResult.code      = true;
    return this.retResult;
  }

  /**
   * Build contract data
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  createContractData(){
    this.retResult.code      = true;
    return this.retResult;
  }
}

module.exports = TxDataCreator;
