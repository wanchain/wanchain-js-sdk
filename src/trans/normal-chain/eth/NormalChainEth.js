'use strict'
let     Transaction             = require('../../transaction/common/Transaction');
let     EthDataSign             = require('../../data-sign/eth/EthDataSign');
let     WanDataSign             = require('../../data-sign/wan/WanDataSign');
let     NormalTxEthDataCreator  = require('../../tx-data-creator/eth/NormalTxEthDataCreator');
let     NormalChain             = require('../common/NormalChain');
let     ccUtil                  = require('../../../api/ccUtil');
let     utils                   = require('../../../util/util');
let     CrossStatus             = require('../../status/Status').CrossStatus;

let logger = utils.getLogger('NormalChainEth.js');

/**
 * @class
 * @augments NormalChain
 */
class NormalChainEth extends NormalChain{
  /**
   * @constructor
   * @param {Object} input  - {@link CrossChain#input input} of final users.(gas, gasPrice, value and so on)
   * @param {Object} config - {@link CrossChain#config config} of cross chain used.
   */
  constructor(input,config) {
    super(input,config);
    this.input.chainType = config.srcChainType;
  }

  createDataCreator(){
    logger.debug("Entering NormalChainEth::createDataCreator");
    this.retResult.code = true;
    this.retResult.result = new NormalTxEthDataCreator(this.input,this.config);
    return this.retResult;
  }
  createDataSign(){
    logger.debug("Entering NormalChainEth::createDataSign");

    this.retResult.code = true;
    if (this.input.chainType === 'ETH'){
      this.retResult.result = new EthDataSign(this.input,this.config)
    }else if (this.input.chainType === 'WAN'){
      this.retResult.result = new WanDataSign(this.input,this.config);
    }else{
      this.retResult.code = false;
      this.retResult.result = "chainType is error.";
    }

    return this.retResult;
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
      "sendTime"               :parseInt(Number(Date.now())/1000).toString(),
      "sentTime"               :"",
      "successTime"            :"",
      "chainAddr" 						  :this.config.srcSCAddrKey,
      "chainType" 						  :this.config.srcChainType,
      "tokenSymbol"            :this.config.tokenSymbol,
      "status"  								:'Sending'
    };
    logger.info("NormalChainEth::preSendTrans");
    logger.info("collection is :",this.config.normalCollection);
    logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.insertItem(this.config.normalCollection,record);
    this.retResult.code = true;
    return this.retResult;
  }

  /**
   * @override
   */
  transFailed(){
    let hashX  = this.input.hashX;
    let record = global.wanDb.getItem(this.config.normalCollection,{hashX:hashX});
    record.status = "Failed";
    logger.info("NormalChainEth::transFailed");
    logger.info("collection is :",this.config.normalCollection);
    logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.normalCollection,{hashX:record.hashX},record);
    this.retResult.code = true;
    return this.retResult;
  }

  postSendTrans(resultSendTrans){
    logger.debug("Entering NormalChainEth::postSendTrans");
    let txHash      = resultSendTrans;
    let hashX       = this.input.hashX;
    let record      = global.wanDb.getItem(this.config.normalCollection,{hashX:hashX});
    record.status   = 'Sent';
    record.txHash   = txHash;
    let cur         = parseInt(Number(Date.now())/1000).toString();
    record.sentTime = cur;
    logger.info("NormalChainEth::postSendTrans");
    logger.info("collection is :",this.config.normalCollection);
    logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.normalCollection,{hashX:record.hashX},record);
    this.retResult.code = true;
    return this.retResult;
  }
}

module.exports = NormalChainEth;
