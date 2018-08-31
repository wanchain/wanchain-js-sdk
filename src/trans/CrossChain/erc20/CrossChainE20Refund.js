'use strict'
let     Transaction             = require('../../Transaction/common/Transaction');
let     E20DataSign             = require('../../DataSign/erc20/E20DataSign');
let     RefundTxE20DataCreator  = require('../../TxDataCreator/erc20/RefundTxE20DataCreator');
let     CrossChain              = require('../common/CrossChain');
let     errorHandle             = require('../../transUtil').errorHandle;
let     retResult               = require('../../transUtil').retResult;
class CrossChainE20Refund extends CrossChain{
  constructor(input,config) {
    super(input,config);
    this.input.chainType = this.input.dstChainType;
  }

  createDataCreator(){
    console.log("Entering CrossChainE20Refund::createDataCreator");
    retResult.code = true;
    retResult.result = new RefundTxE20DataCreator(this.input,this.config);
    return retResult;
  }
  createDataSign(){
    console.log("Entering CrossChainE20Refund::createDataSign");
    retResult.code = true;
    retResult.result = new E20DataSign(this.input,this.config);
    return retResult;
  }

  postSendTrans(){
    console.log("Entering CrossChainE20Refund::postSendTrans");
    retResult.code = true;
    return retResult;
  }
}

module.exports = CrossChainE20Refund;
