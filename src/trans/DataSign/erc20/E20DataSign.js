'use strict'

let     errorHandle   = require('../../transUtil.js').errorHandle;
let     retResult     = require('../../transUtil.js').retResult;
let     DataSign      = require('../common/DataSign');

class E20DataSign  extends  DataSign{
  constructor(input,config) {
    super(input,config);
  }
  sign(tran){
    console.log("Entering E20DataSign::sign");
    retResult.code      = true;
    retResult.result    = tran;
    return retResult;
  }
}
exports.E20DataSign        = E20DataSign;
