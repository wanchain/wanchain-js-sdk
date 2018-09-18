'use strict'
let     errorHandle   = require('../../transUtil').errorHandle;
let     retResult     = require('../../transUtil').retResult;
let     TxDataCreator = require('../common/TxDataCreator');

class RevokeTxBtcDataCreator extends TxDataCreator{
  constructor(input,config) {
    super(input,config);
  }
  createCommonData(){
    global.logger.debug("Entering RevokeTxBtcDataCreator::createCommonData");
    retResult.code      = true;
    return retResult;
  }
  createContractData(){
    global.logger.debug("Entering RevokeTxBtcDataCreator::createContractData");
    retResult.code      = true;
    return retResult;
  }
}

module.exports = RevokeTxBtcDataCreator;