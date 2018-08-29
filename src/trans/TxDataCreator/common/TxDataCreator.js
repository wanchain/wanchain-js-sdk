'use strict'
let     errorHandle   = require('../../transUtil.js').errorHandle;
let     retResult     = require('../../transUtil.js').retResult;

class TxDataCreator {
  constructor(input,config) {
    this.input          = input;
    this.config         = config;
  }
  createCommonData(){
    retResult.code      = true;
    return retResult;
  }
  createContractData(){
    retResult.code      = true;
    return retResult;
  }
}
exports.TxDataCreator = TxDataCreator;
