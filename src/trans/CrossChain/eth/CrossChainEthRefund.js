'use strict'
let     Transaction             = require('../../Transaction/common/Transaction');
let     EthDataSign             = require('../../DataSign/eth/EthDataSign');
let     WanDataSign             = require('../../DataSign/wan/WanDataSign');
let     RefundTxEthDataCreator  = require('../../TxDataCreator/eth/RefundTxEthDataCreator');
let     CrossChain              = require('../common/CrossChain');
let     errorHandle             = require('../../transUtil').errorHandle;
let     retResult               = require('../../transUtil').retResult;
let     CrossStatus             = require('../../status/Status').CrossStatus;

class CrossChainEthRefund extends CrossChain{
  constructor(input,config) {
    super(input,config);
    this.input.chainType = config.dstChainType;
    this.input.keystorePath = config.dstKeyStorePath;
  }

  createDataCreator(){
    global.logger.debug("Entering CrossChainEthRefund::createDataCreator");
    retResult.code = true;
    retResult.result = new RefundTxEthDataCreator(this.input,this.config);
    return retResult;
  }
  createDataSign(){
    global.logger.debug("Entering CrossChainEthRefund::createDataSign");

    retResult.code = true;

    if (this.input.chainType === 'ETH'){
      retResult.result = new EthDataSign(this.input,this.config)
    }else if (this.input.chainType === 'WAN'){
      retResult.result = new WanDataSign(this.input,this.config);
    }else{
      retResult.code = false;
      retResult.result = "chainType is error.";
    }

    return retResult;
  }

  preSendTrans(signedData){
    let record = global.wanDb.getItem(this.config.crossCollection,{x:this.input.x});

    record.status         = CrossStatus.RefundSending;
    global.logger.debug("CrossChainEthRefund::preSendTrans");
    global.logger.debug("collection is :",this.config.crossCollection);
    global.logger.debug("record is :",record);
    global.wanDb.updateItem(this.config.crossCollection,{x:record.x},record);
    retResult.code = true;
    return retResult;
  }

  postSendTrans(resultSendTrans){
    global.logger.debug("Entering CrossChainEthRefund::postSendTrans");
    let txHash  = resultSendTrans;
    let x       = this.input.x;
    let record  = global.wanDb.getItem(this.config.crossCollection,{x:x});
    record.status = CrossStatus.RefundSent;
    record.refundTxHash = txHash;

    global.logger.debug("CrossChainEthRefund::postSendTrans");
    global.logger.debug("collection is :",this.config.crossCollection);
    global.logger.debug("record is :",record);
    global.wanDb.updateItem(this.config.crossCollection,{x:record.x},record);
    retResult.code = true;
    return retResult;
  }
}

module.exports = CrossChainEthRefund;
