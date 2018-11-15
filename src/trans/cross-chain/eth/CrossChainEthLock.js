'use strict'
let     Transaction             = require('../../transaction/common/Transaction');
let     EthDataSign             = require('../../data-sign/eth/EthDataSign');
let     WanDataSign             = require('../../data-sign/wan/WanDataSign');
let     LockTxEthDataCreator    = require('../../tx-data-creator/eth/LockTxEthDataCreator');
let     CrossChain              = require('../common/CrossChain');

let     ccUtil                  = require('../../../api/ccUtil');
let     CrossStatus             = require('../../status/Status').CrossStatus;
/**
 * @class
 * @augments CrossChain
 */
class CrossChainEthLock extends CrossChain{
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
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  createDataCreator(){
    global.logger.debug("Entering CrossChainEthLock::createDataCreator");
    this.retResult.code = true;
    this.retResult.result = new LockTxEthDataCreator(this.input,this.config);
    return this.retResult;
  }

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  createDataSign(){
    global.logger.debug("Entering CrossChainEthLock::createDataSign");

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

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  preSendTrans(signedData){
    let record = {
      "hashX" 									:this.input.hashX,
      "x" 											:this.input.x,
      "from"  									:this.input.from,
      "to"  										:this.input.to,
      "storeman" 								:this.input.storeman,
      "value"  									:this.trans.commonData.value,
      "contractValue" 					:ccUtil.tokenToWeiHex(this.input.amount,this.config.tokenDecimals),
      "sendTime"               :parseInt(Number(Date.now())/1000).toString(),
      "lockedTime" 							:"",
      "buddyLockedTime" 				:"",
      "srcChainAddr" 						:this.config.srcSCAddrKey,
      "dstChainAddr" 						:this.config.dstSCAddrKey,
      "srcChainType" 						:this.config.srcChainType,
      "dstChainType" 						:this.config.dstChainType,
      "status"  								:CrossStatus.LockSending,
      "approveTxHash" 					:"", // will update when sent successfully.
      "lockTxHash" 							:"",
      "redeemTxHash"  					:"",
      "revokeTxHash"  					:"",
      "buddyLockTxHash" 				:"",
      "tokenSymbol"            :this.config.tokenSymbol,
      "tokenStand"             :this.config.tokenStand,
      "htlcTimeOut"            :"", //unit: s
      "buddyLockedTimeOut"     :"",
    };
    global.logger.info("CrossChainEthLock::preSendTrans");
    global.logger.info("collection is :",this.config.crossCollection);
    global.logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.insertItem(this.config.crossCollection,record);
    this.retResult.code = true;
    return this.retResult;
  }

  /**
   * @override
   */
  transFailed(){
    let hashX  = this.input.hashX;
    let record = global.wanDb.getItem(this.config.crossCollection,{hashX:hashX});
    record.status = CrossStatus.LockFail;
    global.logger.info("CrossChainEthLock::transFailed");
    global.logger.info("collection is :",this.config.crossCollection);
    global.logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
    this.retResult.code = true;
    return this.retResult;
  }

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  postSendTrans(resultSendTrans){
    global.logger.debug("Entering CrossChainEthLock::postSendTrans");
    let txHash = resultSendTrans;
    let hashX  = this.input.hashX;
    let record = global.wanDb.getItem(this.config.crossCollection,{hashX:hashX});
    record.status = CrossStatus.LockSent;
    record.lockTxHash = txHash;
    global.logger.info("CrossChainEthLock::postSendTrans");
    global.logger.info("collection is :",this.config.crossCollection);
    global.logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
    this.retResult.code = true;
    return this.retResult;
  }
}

module.exports = CrossChainEthLock;
