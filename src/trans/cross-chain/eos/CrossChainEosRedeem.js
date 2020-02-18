'use strict'
let     Transaction             = require('../../transaction/common/Transaction');
let     EosDataSign             = require('../../data-sign/eos/EosDataSign');
let     EosDataSignWan          = require('../../data-sign/wan/WanDataSign');
let     RedeemTxEosDataCreator  = require('../../tx-data-creator/eos/RedeemTxEosDataCreator');
let     CrossChain              = require('../common/CrossChain');
let     ccUtil                  = require('../../../api/ccUtil');
let     utils                   = require('../../../util/util');
let     CrossStatus             = require('../../status/Status').CrossStatus;

let logger = utils.getLogger('CrossChainEosRedeem.js');

/**
 * @class
 * @augments CrossChain
 */
class CrossChainEosRedeem extends CrossChain{
  /**
   * @constructor
   * @param {Object} input  - {@link CrossChain#input input} of final users.(gas, gasPrice, value and so on)
   * @param {Object} config - {@link CrossChain#config config} of cross chain used.
   */
  constructor(input,config) {
    super(input,config);
    this.input.chainType = config.dstChainType;
    this.input.keystorePath = config.dstKeyStorePath;
    this.input.action = config.redeemScFunc;
  }

  /**
   * @override
   * @returns {*|{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  checkPreCondition(){
    logger.debug("CrossChainEosRedeem::checkPreCondition hashX:",this.input.hashX);
    let record = global.wanDb.getItem(this.config.crossCollection,{hashX:this.input.hashX});
    logger.debug("CrossChainEosRedeem::checkPreCondition record.lockedTime,record.buddyLockedTime,record.status");
    logger.debug(record.lockedTime);
    logger.debug(record.buddyLockedTime);
    logger.debug(record.status);
    return ccUtil.canRedeem(record);
  }

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  createDataCreator(){
    logger.debug("Entering CrossChainEosRedeem::createDataCreator");
    this.retResult.code = true;
    this.retResult.result = new RedeemTxEosDataCreator(this.input,this.config);
    return this.retResult;
  }

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  createDataSign(){
    logger.debug("Entering CrossChainEosRedeem::createDataSign");
    this.retResult.code = true;
    if(this.input.chainType === 'WAN'){
      this.retResult.result = new EosDataSignWan(this.input,this.config);
    }else{
      this.retResult.result = new EosDataSign(this.input,this.config);
    }
    return this.retResult;
  }

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  preSendTrans(signedData){
    let record = global.wanDb.getItem(this.config.crossCollection,{hashX:this.input.hashX});

    record.status         = 'RedeemSending';
    logger.info("CrossChainEosRedeem::preSendTrans");
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
    record.status = CrossStatus.RedeemFail;
    logger.info("CrossChainEosRedeem::transFailed");
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
    logger.debug("Entering CrossChainEosRedeem::postSendTrans");
    let txHash = (this.input.chainType === 'WAN') ? resultSendTrans : resultSendTrans.transaction_id;
    let record = global.wanDb.getItem(this.config.crossCollection,{hashX:this.input.hashX});
    record.redeemTxHash     = txHash;
    record.status           = 'RedeemSent';
    if (this.input.chainType !== 'WAN') {
      record.redeemTxBlockNum       = resultSendTrans.processed.block_num;;
    }

    logger.info("CrossChainEosRedeem::postSendTrans");
    logger.info("collection is :",this.config.crossCollection);
    logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
    this.retResult.code = true;
    return this.retResult;
  }

}

module.exports = CrossChainEosRedeem;
