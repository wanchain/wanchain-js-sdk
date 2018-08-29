'use strict'
let     Transaction               = require('../Transaction/common/Transaction.js');
let     E20DataSign               = require('../../DataSign/erc20/E20DataSign');
let     LockTxE20DataCreator      = require('../../TxDataCreator/erc20/ApproveTxE20DataCreator.js');
let     CrossChain                = require('../common/CrossChain');
let     errorHandle               = require('../../transUtil.js').errorHandle;
let     retResult                 = require('../../transUtil.js').retResult;
class CrossChainE20Lock extends CrossChain{
  constructor(input,config) {
    super(input,config);
  }

  createDataCreator(){
    console.log("Entering CrossChainE20Lock::createDataCreator");
    retResult.code = true;
    retResult.result = new LockTxE20DataCreator(this.input,this.config);
    return retResult;
  }
  createDataSign(){
    console.log("Entering CrossChainE20Lock::createDataSign");
    retResult.code = true;
    retResult.result = new E20DataSign(this.input,this.config);
    return retResult;
  }

  postSendTrans(){
    console.log("Entering CrossChainE20Lock::postSendTrans");
    retResult.code = true;
    return retResult;
  }
}
exports.CrossChainE20Lock = CrossChainE20Lock;
