'use strict'

let     TxDataCreator = require('../common/TxDataCreator');

class LockTxDataBtcCreator extends TxDataCreator{
  constructor(input,config) {
    super(input,config);
  }
  createCommonData(){
    global.logger.debug("Entering LockTxDataBtcCreator::createCommonData");
    this.retResult.code      = true;
    return this.retResult;
  }
  createContractData(){
    global.logger.debug("Entering LockTxDataBtcCreator::createContractData");
    this.retResult.code      = true;
    return this.retResult;
  }
}

module.exports = LockTxDataBtcCreator;