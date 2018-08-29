'use strict'
let     errorHandle   = require('../../transUtil.js').errorHandle;
let     retResult     = require('../../transUtil.js').retResult;
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
exports.ApproveTxE20DataCreator = ApproveTxE20DataCreator;