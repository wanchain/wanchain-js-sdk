'use strict'
let     Transaction             = require('../../transaction/common/Transaction');
let     EosDataSign             = require('../../data-sign/eos/EosDataSign');
let     EosDataSignWan          = require('../../data-sign/wan/WanDataSign');
let     RevokeTxEosDataCreator  = require('../../tx-data-creator/eos/RevokeTxEosDataCreator');
let     CrossChain              = require('../common/CrossChain');
let     ccUtil                  = require('../../../api/ccUtil');
let     utils                   = require('../../../util/util');
let     CrossStatus             = require('../../status/Status').CrossStatus;

let logger = utils.getLogger('CrossChainEosRevoke.js');

/**
 * @class
 * @augments CrossChain
 */
class CrossChainEosRevoke extends CrossChain{
  /**
   * @constructor
   * @param {Object} input  - {@link CrossChain#input input} of final users.(gas, gasPrice, value and so on)
   * @param {Object} config - {@link CrossChain#config config} of cross chain used.
   */
  constructor(input,config) {
    super(input,config);
    this.input.chainType = config.srcChainType;
    this.input.keystorePath = config.srcKeystorePath;
    this.input.action = config.revokeScFunc;
  }

  /**
   * @override
   * @returns {*|{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  checkPreCondition(){
    logger.debug("CrossChainEosRevoke::checkPreCondition hashX:",this.input.hashX);
    let record = global.wanDb.getItem(this.config.crossCollection,{hashX:this.input.hashX});
    // logger.debug("CrossChainEosRevoke::checkPreCondition record.lockedTime,record.buddyLockedTime,record.status");
    // logger.debug(record.lockedTime);
    // logger.debug(record.buddyLockedTime);
    // logger.debug(record.status);
    return ccUtil.canRevoke(record);
  }

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  createDataCreator(){
    logger.debug("Entering CrossChainEosRevoke::createDataCreator");
    this.retResult.code  = true;
    this.retResult.result = new RevokeTxEosDataCreator(this.input,this.config);
    return this.retResult;
  }

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  createDataSign(){
    logger.debug("Entering CrossChainEosRevoke::createDataSign");
    this.retResult.code = true;
    if(this.input.chainType === 'WAN'){
      this.retResult.result = new EosDataSignWan(this.input,this.config);
    }else{
      this.retResult.result = new EosDataSign(this.input,this.config);
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
    logger.info("CrossChainEosRevoke::preSendTrans");
    logger.info("collection is :",this.config.crossCollection);
    logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
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
    logger.info("CrossChainEosRevoke::transFailed");
    logger.info("collection is :",this.config.crossCollection);
    logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
    this.retResult.code = true;
    return this.retResult;
  }

  /**
   *@override
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  postSendTrans(resultSendTrans){
    logger.debug("Entering CrossChainEosRevoke::postSendTrans");
    let txHash = (this.input.chainType === 'WAN') ? resultSendTrans : resultSendTrans.transaction_id;
    let record = global.wanDb.getItem(this.config.crossCollection,{hashX:this.input.hashX});
    record.revokeTxHash     = txHash;
    record.status           = 'RevokeSent';

    logger.info("CrossChainEosRevoke::postSendTrans");
    logger.info("collection is :",this.config.crossCollection);
    logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
    this.retResult.code = true;
    return this.retResult;
  }
}

module.exports = CrossChainEosRevoke;
