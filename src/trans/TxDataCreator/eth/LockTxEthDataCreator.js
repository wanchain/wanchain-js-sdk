'use strict'
let     errorHandle   = require('../../transUtil').errorHandle;
let     retResult     = require('../../transUtil').retResult;
let     TxDataCreator = require('../common/TxDataCreator');

class LockTxEthDataCreator extends TxDataCreator{
  constructor(input,config) {
    super(input,config);
  }
  createCommonData(){
    console.log("Entering LockTxEthDataCreator::createCommonData");
    retResult.code      = true;
    return retResult;
  }
  createContractData(){
    console.log("Entering LockTxEthDataCreator::createContractData");
    retResult.code      = true;
    return retResult;
  }
}

module.exports = LockTxEthDataCreator;