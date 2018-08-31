'use strict'
let     errorHandle   = require('../../transUtil').errorHandle;
let     retResult     = require('../../transUtil').retResult;
let     TxDataCreator = require('../common/TxDataCreator');

class LockTxDataBtcCreator extends TxDataCreator{
  constructor(input,config) {
    super(input,config);
  }
  createCommonData(){
    console.log("Entering LockTxDataBtcCreator::createCommonData");
    retResult.code      = true;
    return retResult;
  }
  createContractData(){
    console.log("Entering LockTxDataBtcCreator::createContractData");
    retResult.code      = true;
    return retResult;
  }
}

module.exports = LockTxDataBtcCreator;