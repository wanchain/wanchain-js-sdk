'use strict'
let     errorHandle   = require('../../transUtil').errorHandle;
let     retResult     = require('../../transUtil').retResult;
class Transaction {
  constructor(input,config) {
    this.input          = input;
    this.config         = config;

    this.commondData    = null;
    this.contractData   = null;
  }
  setCommonData(commonData){
    console.log("Entering Transaction::setCommonData");
    this.commondData    = commonData;
    retResult.code      = true;
    return retResult;
  }
  setContractData(contractData){
    console.log("Entering Transaction::setContractData");
    this.contractData    = contractData;
    retResult.code      = true;
    return retResult;
  }
}

module.exports = Transaction;
