'use strict'
let     Transaction             = require('../../Transaction/common/Transaction');
let     EthDataSign             = require('../../DataSign/eth/EthDataSign');
let     RefundTxEthDataCreator  = require('../../TxDataCreator/eth/RefundTxEthDataCreator');
let     CrossChain              = require('../common/CrossChain');
let     errorHandle             = require('../../transUtil').errorHandle;
let     retResult               = require('../../transUtil').retResult;
class CrossChainEthRefund extends CrossChain{
  constructor(input,config) {
    super(input,config);
    this.input.chainType = config.dstChainType;
  }

  createDataCreator(){
    console.log("Entering CrossChainEthRefund::createDataCreator");
    retResult.code = true;
    retResult.result = new RefundTxEthDataCreator(this.input,this.config);
    return retResult;
  }
  createDataSign(){
    console.log("Entering CrossChainEthRefund::createDataSign");
    retResult.code = true;
    retResult.result = new EthDataSign(this.input,this.config);
    return retResult;
  }

  postSendTrans(){
    console.log("Entering CrossChainEthRefund::postSendTrans");
    retResult.code = true;
    return retResult;
  }
}

module.exports = CrossChainEthRefund;
