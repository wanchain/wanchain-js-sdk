'use strict'
let     Transaction             = require('../../transaction/common/Transaction');
let     EosDataSign             = require('../../data-sign/eos/EosDataSign');
// let     WanDataSign             = require('../../data-sign/wan/WanDataSign');
let     NormalTxEosDataCreator  = require('../../tx-data-creator/eos/NormalTxEosDataCreator');
let     NormalChain             = require('../common/NormalChain');
let     ccUtil                  = require('../../../api/ccUtil');
let     utils                   = require('../../../util/util');
let     CrossStatus             = require('../../status/Status').CrossStatus;

let logger = utils.getLogger('NormalChainEos.js');

/**
 * @class
 * @augments NormalChain
 */
class NormalChainEos extends NormalChain{
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
    logger.debug("Entering NormalChainEos::createDataCreator");
    this.retResult.code = true;
    this.retResult.result = new NormalTxEosDataCreator(this.input,this.config);
    return this.retResult;
  }
  createDataSign(){
    logger.debug("Entering NormalChainEos::createDataSign");

    this.retResult.code = true;
    if (this.input.chainType === 'EOS'){
      this.retResult.result = new EosDataSign(this.input,this.config)
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
      // "gasPrice"               :this.trans.commonData.gasPrice,
      // "gasLimit"               :this.trans.commonData.gasLimit,
      // "nonce"                  :this.trans.commonData.nonce,
      "sendTime"               :parseInt(Number(Date.now())/1000).toString(),
      "sentTime"               :"",
      "successTime"            :"",
      "chainAddr" 						  :this.config.srcSCAddrKey,
      "chainType" 						  :this.config.srcChainType,
      "tokenSymbol"            :this.config.tokenSymbol,
      "status"  								:'Sending'
    };
    if (this.input.action && this.input.action === 'newaccount') {
      record.action = this.input.action;
      record.newaccount = this.input.accountName;
      record.ramBytes = this.input.ramBytes;
      record.netAmount = parseFloat(this.input.netAmount).toFixed(4) + ' EOS';
      record.cpuAmount = parseFloat(this.input.cpuAmount).toFixed(4) + ' EOS';
    } else if (this.input.action && this.input.action === 'buyrambytes') {
      record.action = this.input.action;
      record.ramBytes = this.input.ramBytes;
    } else if (this.input.action && this.input.action === 'sellram') {
      record.action = this.input.action;
      record.ramBytes = this.input.ramBytes;
    } else if (this.input.action && this.input.action === 'delegatebw') {
      record.action = this.input.action;
      record.netAmount = parseFloat(this.input.netAmount).toFixed(4) + ' EOS';
      record.cpuAmount = parseFloat(this.input.cpuAmount).toFixed(4) + ' EOS';
    } else if (this.input.action && this.input.action === 'undelegatebw') {
      record.action = this.input.action;
      record.netAmount = parseFloat(this.input.netAmount).toFixed(4) + ' EOS';
      record.cpuAmount = parseFloat(this.input.cpuAmount).toFixed(4) + ' EOS';
    }
    logger.info("NormalChainEos::preSendTrans");
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
    logger.info("NormalChainEos::transFailed");
    logger.info("collection is :",this.config.normalCollection);
    logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.normalCollection,{hashX:record.hashX},record);
    this.retResult.code = true;
    return this.retResult;
  }

  postSendTrans(resultSendTrans){
    logger.debug("Entering NormalChainEos::postSendTrans");
    let txHash      = resultSendTrans.transaction_id;
    let hashX       = this.input.hashX;
    let record      = global.wanDb.getItem(this.config.normalCollection,{hashX:hashX});
    record.status   = 'Sent';
    record.txHash   = txHash;
    record.txBlockNumber = resultSendTrans.processed.block_num;
    let cur         = parseInt(Number(Date.now())/1000).toString();
    record.sentTime = cur;
    logger.info("NormalChainEos::postSendTrans");
    logger.info("collection is :",this.config.normalCollection);
    logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.normalCollection,{hashX:record.hashX},record);
    this.retResult.code = true;
    return this.retResult;
  }
}

module.exports = NormalChainEos;