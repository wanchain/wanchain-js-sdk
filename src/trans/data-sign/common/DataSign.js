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
   * @param {Object} input  - {@link CrossChain#input input}
   * @param {Object} config - {@link CrossChain#config config}
   */
  constructor(input,config) {
    this.input          = input;
    this.config         = config;
  }

  /**
   * sign data.
   * @override
   * @param srcData
   * @returns {{code: boolean, result: null}|transUtil.retResult|{code, result}}
   */
  sign(srcData){
    retResult.code      = true;
    retResult.result    = srcData;
    return retResult;
  }
};

module.exports = DataSign;
