'use strict'
let     Transaction   = require('../common/Transaction.js');
let     errorHandle   = require('../../transUtil.js').errorHandle;
let     retResult     = require('../../transUtil.js').retResult;
class BtcTransaction extends Transaction {
  constructor(input,config) {
    super(input,config);
  }
  setCommonData(commonData){
    // To Do
    retResult.code      = true;
    return retResult;
  }
  setContractData(contractData){
    // To Do
    retResult.code      = true;
    return retResult;
  }
}
exports.BtcTransaction = BtcTransaction;