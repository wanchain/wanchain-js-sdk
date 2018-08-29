'use strict'
let     errorHandle   = require('../../transUtil').errorHandle;
let     retResult     = require('../../transUtil').retResult;
let     TxDataCreator = require('../common/TxDataCreator');
class ApproveTxE20DataCreator extends TxDataCreator{
  constructor(input,config) {
    super(input,config);
  }
  createCommonData(){
    console.log("Entering ApproveTxE20DataCreator::createCommonData");
    retResult.code      = true;
    return retResult;
  }
  createContractData(){
    console.log("Entering ApproveTxE20DataCreator::createContractData");
    retResult.code      = true;
    return retResult;
  }
}

module.exports = ApproveTxE20DataCreator;