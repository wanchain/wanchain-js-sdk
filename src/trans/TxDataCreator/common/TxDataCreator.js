'use strict'
let     errorHandle   = require('../../transUtil').errorHandle;
let     retResult     = require('../../transUtil').retResult;

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

module.exports = TxDataCreator;
