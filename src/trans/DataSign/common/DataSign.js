'use strict'
let     errorHandle   = require('../../transUtil.js').errorHandle;
let     retResult     = require('../../transUtil.js').retResult;
class DataSign {
  constructor(input,config) {
    this.input          = input;
    this.config         = config;
  }
  sign(srcData){
    retResult.code      = true;
    retResult.result    = srcData;
    return retResult;
  }
}
exports.DataSign        = DataSign;
