'use strict'
let Transaction             = require('../../transaction/common/Transaction');
let EosDataSign             = require('../../data-sign/eos/EosDataSign');
let EosDataSignWan          = require('../../data-sign/wan/WanDataSign');
let ApproveTxEosDataCreator = require('../../tx-data-creator/eos/ApproveTxEosDataCreator');
let CrossChain              = require('../common/CrossChain');
let ccUtil                  = require('../../../api/ccUtil');
let utils                   = require('../../../util/util');
let CrossStatus             = require('../../status/Status').CrossStatus;

let logger = utils.getLogger('CrossChainEosApprove.js');
/**
 * @class
 * @augments CrossChain
 */
class CrossChainEosApprove extends CrossChain{
  /**
   * @constructor
   * @param {Object} input  - {@link CrossChain#input input} of final users.(gas, gasPrice, value and so on)
   * @param {Object} config - {@link CrossChain#config config} of cross chain used.
   */
  constructor(input,config) {
    super(input,config);
    this.input.chainType = config.srcChainType;
    this.input.keystorePath = config.srcKeystorePath;
  }

  /**
   * @override
   */
  createDataCreator(){
    logger.debug("Entering CrossChainEosApprove::createDataCreator");
    this.retResult.code    = true;
    this.retResult.result  = new ApproveTxEosDataCreator(this.input,this.config);
    return this.retResult;
  }
  /**
   * @override
   */
  createDataSign(){
    logger.debug("Entering CrossChainEosApprove::createDataSign");
    this.retResult.code    = true;
    if(this.input.chainType === 'WAN'){
      this.retResult.result = new EosDataSignWan(this.input,this.config);
    }else{
      this.retResult.result = new EosDataSign(this.input,this.config);
    }
    return this.retResult;
  }
  /**
   * @override
   */
  preSendTrans(signedData){
    let record = global.wanDb.getItem(this.config.crossCollection,{hashX:this.trans.commonData.hashX});
    // if record exisit update
    if(record){

      record.status         = 'ApproveSending';
      record.contractValue  = ccUtil.tokenToWeiHex(this.input.amount,this.config.tokenDecimals);
      global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);

    }else{
      record = {
        "hashX"             :this.trans.commonData.hashX,
        "x"                 :this.trans.commonData.x,
        "from"              :this.input.from,
        "to"                :this.input.to,
        "storeman"          :this.input.storeman,
        "value"             :this.trans.commonData.value,
        "contractValue"     :ccUtil.tokenToWeiHex(this.input.amount,this.config.tokenDecimals),
        "sendTime"          :parseInt(Number(Date.now())/1000).toString(),
        "lockedTime"        :"",
        "buddyLockedTime"   :"",
        "srcChainAddr"      :this.config.srcSCAddrKey,
        "dstChainAddr"      :this.config.dstSCAddrKey,
        "srcChainType"      :this.config.srcChainType,
        "dstChainType"      :this.config.dstChainType,
        "status"            :"ApproveSending",
        "approveTxHash"     :this.trans.commonData.hashX, // will update when sent successfully.
        "lockTxHash"        :"",
        "redeemTxHash"      :"",
        "revokeTxHash"      :"",
        "buddyLockTxHash"   :"",
        "tokenSymbol"       :this.config.tokenSymbol,
        "tokenStand"        :this.config.tokenStand,
        "htlcTimeOut"       :"", //unit: s
        "buddyLockedTimeOut":"",
      };
      record.action = this.input.action;
      if((typeof(this.input.approveZero) !== 'undefined') && (this.input.approveZero === true)){
        record.status = "ApproveZeroSending";
      }
      logger.info("CrossChainEosApprove::preSendTrans");
      logger.info("collection is :",this.config.crossCollection);
      logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
      global.wanDb.insertItem(this.config.crossCollection,record);
    }
    this.retResult.code = true;
    return this.retResult;
  }

  /**
   * @override
   */
  transFailed(){
    let hashX  = this.input.hashX;
    let record = global.wanDb.getItem(this.config.crossCollection,{hashX:hashX});
    record.status = CrossStatus.ApproveFail;
    logger.info("CrossChainEosApprove::transFailed");
    logger.info("collection is :",this.config.crossCollection);
    logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
    this.retResult.code = true;
    return this.retResult;
  }

  /**
   * @override
   */
  postSendTrans(resultSendTrans){
    logger.debug("Entering CrossChainEosApprove::postSendTrans");
    let txHash = resultSendTrans;
    let hashX  = this.trans.commonData.hashX;
    let record = global.wanDb.getItem(this.config.crossCollection,{hashX:hashX});
    if(typeof(this.input.approveZero) === 'undefined' || this.input.approveZero === false){
      record.status = 'ApproveSent';
      record.approveTxHash = txHash;
    }else{
      record.status = 'ApproveZeroSent';
      record.approveZeroTxHash = txHash;
    }
    logger.info("CrossChainEosApprove::postSendTrans");
    logger.info("collection is :",this.config.crossCollection);
    logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
    this.retResult.code = true;
    return this.retResult;
  }
}
module.exports = CrossChainEosApprove;
