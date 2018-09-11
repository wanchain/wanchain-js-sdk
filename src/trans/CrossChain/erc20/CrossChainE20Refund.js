'use strict'
let     Transaction             = require('../../Transaction/common/Transaction');
let     E20DataSign             = require('../../DataSign/erc20/E20DataSign');
let     E20DataSignWan          = require('../../DataSign/wan/WanDataSign');
let     RefundTxE20DataCreator  = require('../../TxDataCreator/erc20/RefundTxE20DataCreator');
let     CrossChain              = require('../common/CrossChain');
let     errorHandle             = require('../../transUtil').errorHandle;
let     retResult               = require('../../transUtil').retResult;
class CrossChainE20Refund extends CrossChain{
  constructor(input,config) {
    super(input,config);
    this.input.chainType = config.dstChainType;
  }
  checkPreCondition(){
    let record = global.wanDb.getItem(this.config.crossCollection,{hashX:this.input.hashX});
    return ccUtil.canRefund(record.lockedTime,record.buddyLockedTime,record.status);
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
    if(this.input.chainType === 'WAN'){
      retResult.result = new E20DataSignWan(this.input,this.config);
    }else{
      retResult.result = new E20DataSign(this.input,this.config);
    }
    return retResult;
  }

  preSendTrans(signedData){
    let record = global.wanDb.getItem(this.config.crossCollection,{hashX:this.input.hashX});
    record.signedDataRefund = signedData;
    record.status         = 'RefundSending';
    console.log("CrossChainE20Refund::preSendTrans");
    console.log("collection is :",this.config.crossCollection);
    console.log("record is :",record);
    global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
    retResult.code = true;
    return retResult;
  }
  postSendTrans(resultSendTrans){
    console.log("Entering CrossChainE20Refund::postSendTrans");
    let txHash = resultSendTrans;
    let record = global.wanDb.getItem(this.config.crossCollection,{hashX:this.input.hashX});
    record.refundTxHash     = txHash;
    record.signedDataRefund = '';
    record.status           = 'RefundSent';

    console.log("CrossChainE20Refund::postSendTrans");
    console.log("collection is :",this.config.crossCollection);
    console.log("record is :",record);
    global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
    retResult.code = true;
    return retResult;
  }

}

module.exports = CrossChainE20Refund;
