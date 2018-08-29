'use strict'

let     errorHandle   = require('../../transUtil').errorHandle;
let     retResult     = require('../../transUtil').retResult;
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
};

module.exports = E20DataSign;