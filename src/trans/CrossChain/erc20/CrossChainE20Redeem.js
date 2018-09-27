'use strict'
let     Transaction             = require('../../Transaction/common/Transaction');
let     E20DataSign             = require('../../DataSign/erc20/E20DataSign');
let     E20DataSignWan          = require('../../DataSign/wan/WanDataSign');
let     RedeemTxE20DataCreator  = require('../../TxDataCreator/erc20/RedeemTxE20DataCreator');
let     CrossChain              = require('../common/CrossChain');
let     errorHandle             = require('../../transUtil').errorHandle;
let     retResult               = require('../../transUtil').retResult;
let     ccUtil                    = require('../../../api/ccUtil');

class CrossChainE20Redeem extends CrossChain{
  constructor(input,config) {
    super(input,config);
    this.input.chainType = config.dstChainType;
    this.input.keystorePath = config.dstKeyStorePath;
  }
  checkPreCondition(){
    global.logger.debug("CrossChainE20Redeem::checkPreCondition hashX:",this.input.hashX);
    let record = global.wanDb.getItem(this.config.crossCollection,{hashX:this.input.hashX});
    global.logger.debug("CrossChainE20Redeem::checkPreCondition record.lockedTime,record.buddyLockedTime,record.status");
    global.logger.debug(record.lockedTime);
    global.logger.debug(record.buddyLockedTime);
    global.logger.debug(record.status);
    return ccUtil.canRedeem(record);
  }
  createDataCreator(){
    global.logger.debug("Entering CrossChainE20Redeem::createDataCreator");
    retResult.code = true;
    retResult.result = new RedeemTxE20DataCreator(this.input,this.config);
    return retResult;
  }
  createDataSign(){
    global.logger.debug("Entering CrossChainE20Redeem::createDataSign");
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

    record.status         = 'RedeemSending';
    global.logger.debug("CrossChainE20Redeem::preSendTrans");
    global.logger.debug("collection is :",this.config.crossCollection);
    global.logger.debug("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
    retResult.code = true;
    return retResult;
  }
  postSendTrans(resultSendTrans){
    global.logger.debug("Entering CrossChainE20Redeem::postSendTrans");
    let txHash = resultSendTrans;
    let record = global.wanDb.getItem(this.config.crossCollection,{hashX:this.input.hashX});
    record.redeemTxHash     = txHash;
    record.status           = 'RedeemSent';

    global.logger.debug("CrossChainE20Redeem::postSendTrans");
    global.logger.debug("collection is :",this.config.crossCollection);
    global.logger.debug("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
    retResult.code = true;
    return retResult;
  }

}

module.exports = CrossChainE20Redeem;
