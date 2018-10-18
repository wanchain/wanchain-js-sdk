'use strict'
let     Transaction                   = require('../../Transaction/common/Transaction');
let     E20DataSign                   = require('../../DataSign/erc20/E20DataSign');
let     E20DataSignWan                = require('../../DataSign/wan/WanDataSign');
let     NormalTxE20DataCreator       = require('../../TxDataCreator/erc20/NormalTxE20DataCreator');
let     NormalChain                   = require('../common/NormalChain');
let     {retResult,errorHandle}       = require('../../transUtil');
let     ccUtil                        = require('../../../api/ccUtil');

class NormalChainE20 extends NormalChain{
  constructor(input,config) {
    super(input,config);
    this.input.chainType = config.srcChainType;
  }

  createDataCreator(){
    global.logger.debug("Entering NormalChainE20::createDataCreator");
    retResult.code    = true;
    retResult.result  = new NormalTxE20DataCreator(this.input,this.config);
    return retResult;
  }
  createDataSign(){
    global.logger.debug("Entering NormalChainE20::createDataSign");
    retResult.code    = true;
    if(this.input.chainType === 'WAN'){
      retResult.result = new E20DataSignWan(this.input,this.config);
    }else{
      retResult.result = new E20DataSign(this.input,this.config);
    }
    return retResult;
  }
  preSendTrans(signedData){
    let record = {
      "hashX"                  :this.input.hashX,
      "txHash"                 :this.input.hashX,
      "from"  									:this.trans.commonData.from,
      "to"  										:this.input.to,
      "value"  									:ccUtil.tokenToWeiHex(this.input.amount,this.config.tokenDecimals),
      "gasPrice"               :this.trans.commonData.gasPrice,
      "gasLimit"               :this.trans.commonData.gasLimit,
      "nonce"                  :this.trans.commonData.nonce,
      "time"                   :"",
      "chainAddr" 						  :this.config.srcSCAddrKey,
      "chainType" 						  :this.config.srcChainType,
      "tokenSymbol"            :this.config.tokenSymbol,
      "status"  								:'Sending'
    };
    global.logger.info("NormalChainE20::preSendTrans");
    global.logger.info("collection is :",this.config.normalCollection);
    global.logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.insertItem(this.config.normalCollection,record);
    retResult.code = true;
    return retResult;
  }

  postSendTrans(resultSendTrans){
    global.logger.debug("Entering NormalChainE20::postSendTrans");
    let txHash = resultSendTrans;
    let hashX  = this.input.hashX;
    let record = global.wanDb.getItem(this.config.normalCollection,{hashX:hashX});
    record.status = 'Sent';
    record.txHash = txHash;
    global.logger.info("NormalChainE20::postSendTrans");
    global.logger.info("collection is :",this.config.normalCollection);
    global.logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.normalCollection,{hashX:record.hashX},record);
    retResult.code = true;
    return retResult;
  }
}
module.exports = NormalChainE20;
