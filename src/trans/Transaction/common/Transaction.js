'use strict'
let     errorHandle   = require('../../transUtil').errorHandle;
let     retResult     = require('../../transUtil').retResult;
class Transaction {
  constructor(input,config) {
    this.input          = input;
    this.config         = config;

    this.commonData     = null;
    this.contractData   = null;
  }
  setCommonData(commonData){
    global.logger.debug("Entering Transaction::setCommonData");
    this.commonData     = commonData;
    retResult.code      = true;
    return retResult;
  }
  setContractData(contractData){
    global.logger.debug("Entering Transaction::setContractData");
    this.contractData     = contractData;
    this.commonData.data  = contractData;
    retResult.code        = true;
    return retResult;
  }
}

module.exports = Transaction;
