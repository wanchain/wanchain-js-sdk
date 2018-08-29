'use strict'
let     errorHandle   = require('../../transUtil').errorHandle;
let     retResult     = require('../../transUtil').retResult;
let     TxDataCreator = require('../common/TxDataCreator');

class RefundTxEthDataCreator extends TxDataCreator{
  constructor(input,config) {
    super(input,config);
  }
  createCommonData(){
    console.log("Entering RefundTxEthDataCreator::createCommonData");
    retResult.code      = true;
    return retResult;
  }
  createContractData(){
    console.log("Entering RefundTxEthDataCreator::createContractData");
    retResult.code      = true;
    return retResult;
  }
}

module.exports = RefundTxEthDataCreator;