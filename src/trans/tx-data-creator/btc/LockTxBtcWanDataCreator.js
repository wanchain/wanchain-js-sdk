'use strict'

let     TxDataCreator = require('../common/TxDataCreator');

class LockTxBtcWanDataCreator extends TxDataCreator{
  constructor(input,config) {
    super(input,config);
  }

  async createCommonData(){
    global.logger.debug("Entering LockTxBtcWanDataCreator::createCommonData");
    this.retResult.code      = true;
    return this.retResult;
  }
  createContractData(){
    global.logger.debug("Entering LockTxBtcWanDataCreator::createContractData");
    this.retResult.code      = true;
    return this.retResult;
  }
}

module.exports = LockTxBtcWanDataCreator;
