'use strict'
let     Transaction   = require('../common/Transaction');
let     errorHandle   = require('../../transUtil').errorHandle;
let     retResult     = require('../../transUtil').retResult;
class BtcTransaction extends Transaction {
  constructor(input,config) {
    super(input,config);
  }
  setCommonData(commonData){
    console.log("Entering BtcTransaction::setCommonData");
    // To Do
    retResult.code      = true;
    return retResult;
  }
  setContractData(contractData){
    console.log("Entering BtcTransaction::setContractData");
    // To Do
    retResult.code      = true;
    return retResult;
  }
}

module.exports = BtcTransaction;