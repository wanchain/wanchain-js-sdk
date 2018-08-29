'use strict'

let     errorHandle   = require('../../transUtil.js').errorHandle;
let     retResult     = require('../../transUtil.js').retResult;
let     DataSign      = require('../common/DataSign');

class EthDataSign  extends  DataSign{
  constructor(input,config) {
    super(input,config);
  }
  sign(tran){
    retResult.code      = true;
    retResult.result    = tran;
    return retResult;
  }
}
exports.EthDataSign        = EthDataSign;