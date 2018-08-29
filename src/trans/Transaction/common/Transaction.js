'use strict'
let     errorHandle   = require('../../transUtil.js').errorHandle;
let     retResult     = require('../../transUtil.js').retResult;
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
    this.commondData    = contractData;
    retResult.code      = true;
    return retResult;
  }
}
exports.Transaction = Transaction;
