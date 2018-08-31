'use strict'
let     errorHandle   = require('../../transUtil').errorHandle;
let     retResult     = require('../../transUtil').retResult;
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
};

module.exports = DataSign;
