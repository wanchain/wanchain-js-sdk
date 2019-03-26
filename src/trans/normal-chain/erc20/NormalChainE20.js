'use strict'
let     Transaction                   = require('../../transaction/common/Transaction');
let     E20DataSign                   = require('../../data-sign/erc20/E20DataSign');
let     E20DataSignWan                = require('../../data-sign/wan/WanDataSign');
let     NormalTxE20DataCreator       = require('../../tx-data-creator/erc20/NormalTxE20DataCreator');
let     NormalChain                   = require('../common/NormalChain');
let     ccUtil                        = require('../../../api/ccUtil');
let     utils                         = require('../../../util/util');
let     CrossStatus                   = require('../../status/Status').CrossStatus;

let logger = utils.getLogger('NormalChainE20.js');
/**
 * @class
 * @augments NormalChain
 */
class NormalChainE20 extends NormalChain{
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
    logger.debug("Entering NormalChainE20::createDataCreator");
    this.retResult.code    = true;
    this.retResult.result  = new NormalTxE20DataCreator(this.input,this.config);
    return this.retResult;
  }
  createDataSign(){
    logger.debug("Entering NormalChainE20::createDataSign");
    this.retResult.code    = true;
    if(this.input.chainType === 'WAN'){
      this.retResult.result = new E20DataSignWan(this.input,this.config);
    }else{
      this.retResult.result = new E20DataSign(this.input,this.config);
    }
    return this.retResult;
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
      "sendTime"               :parseInt(Number(Date.now())/1000).toString(),
      "sentTime"               :"",
      "successTime"            :"",
      "chainAddr" 						  :this.config.srcSCAddrKey,
      "chainType" 						  :this.config.srcChainType,
      "tokenSymbol"            :this.config.tokenSymbol,
      "status"  								:'Sending'
    };
    logger.info("NormalChainE20::preSendTrans");
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
    logger.info("NormalChainE20::transFailed");
    logger.info("collection is :",this.config.normalCollection);
    logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.normalCollection,{hashX:record.hashX},record);
    this.retResult.code = true;
    return this.retResult;
  }

  postSendTrans(resultSendTrans){
    logger.debug("Entering NormalChainE20::postSendTrans");
    let txHash      = resultSendTrans;
    let hashX       = this.input.hashX;
    let record      = global.wanDb.getItem(this.config.normalCollection,{hashX:hashX});
    record.status   = 'Sent';
    record.txHash   = txHash;
    let cur         = parseInt(Number(Date.now())/1000).toString();
    record.sentTime = cur;
    logger.info("NormalChainE20::postSendTrans");
    logger.info("collection is :",this.config.normalCollection);
    logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.normalCollection,{hashX:record.hashX},record);
    this.retResult.code = true;
    return this.retResult;
  }
}
module.exports = NormalChainE20;
