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
   * @param {Object} input  - {@link CrossChain#input input}
   * @param {Object} config - {@link CrossChain#config config}
   */
  constructor(input,config) {
    this.input          = input;
    this.config         = config;
  }

  /**
   * Build common data
   * @returns {{code: boolean, result: null}|transUtil.retResult|{code, result}}
   */
  createCommonData(){
    retResult.code      = true;
    return retResult;
  }

  /**
   * Build contract data
   * @returns {{code: boolean, result: null}|transUtil.retResult|{code, result}}
   */
  createContractData(){
    retResult.code      = true;
    return retResult;
  }
}

module.exports = TxDataCreator;
