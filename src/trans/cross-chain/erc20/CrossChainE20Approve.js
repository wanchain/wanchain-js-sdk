'use strict'
let Transaction             = require('../../transaction/common/Transaction');
let E20DataSign             = require('../../data-sign/erc20/E20DataSign');
let E20DataSignWan          = require('../../data-sign/wan/WanDataSign');
let ApproveTxE20DataCreator = require('../../tx-data-creator/erc20/ApproveTxE20DataCreator');
let CrossChain              = require('../common/CrossChain');
let ccUtil                  = require('../../../api/ccUtil');
let utils                   = require('../../../util/util');
let CrossStatus             = require('../../status/Status').CrossStatus;

let logger = utils.getLogger('CrossChainE20Approve.js');
/**
 * @class
 * @augments CrossChain
 */
class CrossChainE20Approve extends CrossChain{
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
    logger.debug("Entering CrossChainE20Approve::createDataCreator");
    this.retResult.code    = true;
    this.retResult.result  = new ApproveTxE20DataCreator(this.input,this.config);
    return this.retResult;
  }
  /**
   * @override
   */
  createDataSign(){
    logger.debug("Entering CrossChainE20Approve::createDataSign");
    this.retResult.code    = true;
    if(this.input.chainType === 'WAN'){
      this.retResult.result = new E20DataSignWan(this.input,this.config);
    }else{
      this.retResult.result = new E20DataSign(this.input,this.config);
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
      if((typeof(this.input.approveZero) !== 'undefined') && (this.input.approveZero === true)){
        record.status = "ApproveZeroSending";
      }
      logger.info("CrossChainE20Approve::preSendTrans");
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
    logger.info("CrossChainE20Approve::transFailed");
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
    logger.debug("Entering CrossChainE20Approve::postSendTrans");
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
    logger.info("CrossChainE20Approve::postSendTrans");
    logger.info("collection is :",this.config.crossCollection);
    logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
    this.retResult.code = true;
    return this.retResult;
  }
}
module.exports = CrossChainE20Approve;
