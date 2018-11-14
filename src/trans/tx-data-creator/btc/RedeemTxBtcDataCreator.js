'use strict'
let     TxDataCreator = require('../common/TxDataCreator');

class RedeemTxBtcDataCreator extends TxDataCreator{
  constructor(input,config) {
    super(input,config);
  }
  createCommonData(){
    global.logger.debug("Entering RedeemTxBtcDataCreator::createCommonData");
    this.retResult.code      = true;
    return this.retResult;
  }
  createContractData(){
    global.logger.debug("Entering RedeemTxBtcDataCreator::createContractData");
    this.retResult.code      = true;
    return this.retResult;
  }
}

module.exports = RedeemTxBtcDataCreator;