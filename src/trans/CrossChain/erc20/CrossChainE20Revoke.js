'use strict'
let     Transaction             = require('../../Transaction/common/Transaction');
let     E20DataSign             = require('../../DataSign/erc20/E20DataSign');
let     RevokeTxE20DataCreator  = require('../../TxDataCreator/erc20/RevokeTxE20DataCreator');
let     CrossChain              = require('../common/CrossChain');
let     errorHandle             = require('../../transUtil').errorHandle;
let     retResult               = require('../../transUtil').retResult;
class CrossChainE20Revoke extends CrossChain{
  constructor(input,config) {
    super(input,config);
    this.input.chainType = config.srcChainType;
  }

  createDataCreator(){
    console.log("Entering CrossChainE20Revoke::createDataCreator");
    retResult.code = true;
    retResult.result = new RevokeTxE20DataCreator(this.input,this.config);
    return retResult;
  }
  createDataSign(){
    console.log("Entering CrossChainE20Revoke::createDataSign");
    retResult.code = true;
    retResult.result = new E20DataSign(this.input,this.config);
    return retResult;
  }

  preSendTrans(signedData){
    let record = global.wanDb.getItem(this.config.crossCollection,{hashX:this.input.hashX});
    record.signedDataRevoke = signedData;
    record.status         = 'RevokeSending';
    console.log("CrossChainE20Revoke::preSendTrans");
    console.log("collection is :",this.config.crossCollection);
    console.log("record is :",record);
    global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
    retResult.code = true;
    return retResult;
  }
  postSendTrans(resultSendTrans){
    console.log("Entering CrossChainE20Revoke::postSendTrans");
    let txHash = resultSendTrans;
    let record = global.wanDb.getItem(this.config.crossCollection,{hashX:this.input.hashX});
    record.revokeTxHash     = txHash;
    record.signedDataRevoke = '';
    record.status           = 'RefundSent';

    console.log("CrossChainE20Revoke::postSendTrans");
    console.log("collection is :",this.config.crossCollection);
    console.log("record is :",record);
    global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
    retResult.code = true;
    return retResult;
  }
}

module.exports = CrossChainE20Revoke;
