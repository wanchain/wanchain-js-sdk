'use strict'
let     TxDataCreator = require('../common/TxDataCreator');

class RevokeTxBtcDataCreator extends TxDataCreator{
  constructor(input,config) {
    super(input,config);
  }
  createCommonData(){
    global.logger.debug("Entering RevokeTxBtcDataCreator::createCommonData");
    this.retResult.code      = true;
    return this.retResult;
  }
  createContractData(){
    global.logger.debug("Entering RevokeTxBtcDataCreator::createContractData");
    this.retResult.code      = true;
    return this.retResult;
  }
}

module.exports = RevokeTxBtcDataCreator;