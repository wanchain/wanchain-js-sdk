'use strict'
let     Transaction                   = require('../Transaction/common/Transaction.js');
let     E20DataSign                   = require('../../DataSign/erc20/E20DataSign');
let     ApproveTxE20DataCreator       = require('../../TxDataCreator/erc20/ApproveTxE20DataCreator.js');
let     CrossChain                    = require('../common/CrossChain');
let     errorHandle                   = require('../../transUtil.js').errorHandle;
let     retResult                     = require('../../transUtil.js').retResult;
class CrossChainE20Approve extends CrossChain{
  constructor(input,config) {
    super(input,config);
  }

  createDataCreator(){
    console.log("Entering CrossChainE20Approve::createDataCreator");
    retResult.code = true;
    retResult.result = new ApproveTxE20DataCreator(this.input,this.config);
    return retResult;
  }
  createDataSign(){
    console.log("Entering CrossChainE20Approve::createDataSign");
    retResult.code = true;
    retResult.result = new E20DataSign(this.input,this.config);
    return retResult;
  }

  postSendTrans(){
    console.log("Entering CrossChainE20Approve::postSendTrans");
    retResult.code = true;
    return retResult;
  }
}
exports.CrossChainE20Approve = CrossChainE20Approve;
