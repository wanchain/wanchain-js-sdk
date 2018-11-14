'use strict'
let     Transaction   = require('../common/Transaction');
class BtcTransaction extends Transaction {
  constructor(input,config) {
    super(input,config);
  }
  setCommonData(commonData){
    global.logger.debug("Entering BtcTransaction::setCommonData");
    // To Do
    this.retResult.code      = true;
    return this.retResult;
  }
  setContractData(contractData){
    global.logger.debug("Entering BtcTransaction::setContractData");
    // To Do
    this.retResult.code      = true;
    return this.retResult;
  }
}

module.exports = BtcTransaction;