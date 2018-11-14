'use strict'
let     errorHandle   = require('../../transUtil').errorHandle;
let     retResult     = require('../../transUtil').retResult;
/**
 * class use to sign transaction
 * @class
 *
 */
class DataSign {
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
   * sign data.
   * @param {Object} srcData - Source data before signed.
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  sign(srcData){
    this.retResult.code      = true;
    this.retResult.result    = srcData;
    return this.retResult;
  }
};

module.exports = DataSign;
