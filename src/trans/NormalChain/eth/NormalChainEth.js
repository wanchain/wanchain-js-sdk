'use strict'
let     Transaction             = require('../../Transaction/common/Transaction');
let     EthDataSign             = require('../../DataSign/eth/EthDataSign');
let     WanDataSign             = require('../../DataSign/wan/WanDataSign');
let     NormalTxEthDataCreator  = require('../../TxDataCreator/eth/NormalTxEthDataCreator');
let     NormalChain             = require('../common/NormalChain');
let     errorHandle             = require('../../transUtil').errorHandle;
let     retResult               = require('../../transUtil').retResult;
let     ccUtil                  = require('../../../api/ccUtil');
let     CrossStatus             = require('../../status/Status').CrossStatus;

/**
 * @class
 * @augments NormalChain
 */
class NormalChainEth extends NormalChain{
  /**
   * @constructor
   * @param {Object} input  - {@link CrossChain#input input}
   * @param {Object} config - {@link CrossChain#config config}
   */
  constructor(input,config) {
    super(input,config);
    this.input.chainType = config.srcChainType;
  }

  createDataCreator(){
    global.logger.debug("Entering NormalChainEth::createDataCreator");
    retResult.code = true;
    retResult.result = new NormalTxEthDataCreator(this.input,this.config);
    return retResult;
  }
  createDataSign(){
    global.logger.debug("Entering NormalChainEth::createDataSign");

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
    let record = {
      "hashX"                  :this.input.hashX,
      "txHash"                 :this.input.hashX,
      "from"  									:this.trans.commonData.from,
      "to"  										:this.trans.commonData.to,
      "value"  									:this.trans.commonData.value,
      "gasPrice"               :this.trans.commonData.gasPrice,
      "gasLimit"               :this.trans.commonData.gasLimit,
      "nonce"                  :this.trans.commonData.nonce,
      "time"                   :"",
      "chainAddr" 						  :this.config.srcSCAddrKey,
      "chainType" 						  :this.config.srcChainType,
      "tokenSymbol"            :this.config.tokenSymbol,
      "status"  								:'Sending'
    };
    global.logger.info("NormalChainEth::preSendTrans");
    global.logger.info("collection is :",this.config.normalCollection);
    global.logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.insertItem(this.config.normalCollection,record);
    retResult.code = true;
    return retResult;
  }

  postSendTrans(resultSendTrans){
    global.logger.debug("Entering NormalChainEth::postSendTrans");
    let txHash = resultSendTrans;
    let hashX  = this.input.hashX;
    let record = global.wanDb.getItem(this.config.normalCollection,{hashX:hashX});
    record.status = 'Sent';
    record.txHash = txHash;
    global.logger.info("NormalChainEth::postSendTrans");
    global.logger.info("collection is :",this.config.normalCollection);
    global.logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.normalCollection,{hashX:record.hashX},record);
    retResult.code = true;
    return retResult;
  }
}

module.exports = NormalChainEth;
