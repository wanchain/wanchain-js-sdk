'use strict'
let     errorHandle   = require('../../transUtil.js').errorHandle;
let     retResult     = require('../../transUtil.js').retResult;
let     TxDataCreator = require('../common/TxDataCreator');

class RefundTxEthDataCreator extends TxDataCreator{
  constructor(input,config) {
    super(input,config);
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
exports.LockTxEthDataCreator = RefundTxEthDataCreator;