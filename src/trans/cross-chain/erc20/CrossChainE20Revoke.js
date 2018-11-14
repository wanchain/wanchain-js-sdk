'use strict'
let     Transaction             = require('../../transaction/common/Transaction');
let     E20DataSign             = require('../../data-sign/erc20/E20DataSign');
let     E20DataSignWan          = require('../../data-sign/wan/WanDataSign');
let     RevokeTxE20DataCreator  = require('../../tx-data-creator/erc20/RevokeTxE20DataCreator');
let     CrossChain              = require('../common/CrossChain');
let     ccUtil                  = require('../../../api/ccUtil');
let     CrossStatus             = require('../../status/Status').CrossStatus;
/**
 * @class
 * @augments CrossChain
 */
class CrossChainE20Revoke extends CrossChain{
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
   * @returns {*|{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  checkPreCondition(){
    global.logger.debug("CrossChainE20Revoke::checkPreCondition hashX:",this.input.hashX);
    let record = global.wanDb.getItem(this.config.crossCollection,{hashX:this.input.hashX});
    // global.logger.debug("CrossChainE20Revoke::checkPreCondition record.lockedTime,record.buddyLockedTime,record.status");
    // global.logger.debug(record.lockedTime);
    // global.logger.debug(record.buddyLockedTime);
    // global.logger.debug(record.status);
    return ccUtil.canRevoke(record);
  }

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  createDataCreator(){
    global.logger.debug("Entering CrossChainE20Revoke::createDataCreator");
    this.retResult.code  = true;
    this.retResult.result = new RevokeTxE20DataCreator(this.input,this.config);
    return this.retResult;
  }

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  createDataSign(){
    global.logger.debug("Entering CrossChainE20Revoke::createDataSign");
    this.retResult.code = true;
    if(this.input.chainType === 'WAN'){
      this.retResult.result = new E20DataSignWan(this.input,this.config);
    }else{
      this.retResult.result = new E20DataSign(this.input,this.config);
    }
    return this.retResult;
  }

  /**
   *@override
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  preSendTrans(signedData){
    let record = global.wanDb.getItem(this.config.crossCollection,{hashX:this.input.hashX});

    record.status         = 'RevokeSending';
    global.logger.info("CrossChainE20Revoke::preSendTrans");
    global.logger.info("collection is :",this.config.crossCollection);
    global.logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
    this.retResult.code = true;
    return this.retResult;
  }

  /**
   * @override
   */
  transFailed(){
    let hashX  = this.input.hashX;
    let record = global.wanDb.getItem(this.config.crossCollection,{hashX:hashX});
    record.status = CrossStatus.RevokeFail;
    global.logger.info("CrossChainE20Revoke::transFailed");
    global.logger.info("collection is :",this.config.crossCollection);
    global.logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
    this.retResult.code = true;
    return this.retResult;
  }

  /**
   *@override
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  postSendTrans(resultSendTrans){
    global.logger.debug("Entering CrossChainE20Revoke::postSendTrans");
    let txHash = resultSendTrans;
    let record = global.wanDb.getItem(this.config.crossCollection,{hashX:this.input.hashX});
    record.revokeTxHash     = txHash;
    record.status           = 'RevokeSent';

    global.logger.info("CrossChainE20Revoke::postSendTrans");
    global.logger.info("collection is :",this.config.crossCollection);
    global.logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
    this.retResult.code = true;
    return this.retResult;
  }
}

module.exports = CrossChainE20Revoke;
