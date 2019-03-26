'use strict'
let     Transaction             = require('../../transaction/common/Transaction');
let     EthDataSign             = require('../../data-sign/eth/EthDataSign');
let     WanDataSign             = require('../../data-sign/wan/WanDataSign');
let     RedeemTxEthDataCreator  = require('../../tx-data-creator/eth/RedeemTxEthDataCreator');
let     CrossChain              = require('../common/CrossChain');

let     CrossStatus             = require('../../status/Status').CrossStatus;
let     ccUtil                  = require('../../../api/ccUtil');
let     utils                   = require('../../../util/util');

let logger = utils.getLogger('CrossChainEthRedeem.js');

/**
 * @class
 * @augments CrossChain
 */
class CrossChainEthRedeem extends CrossChain{
  /**
   * @constructor
   * @param {Object} input  - {@link CrossChain#input input} of final users.(gas, gasPrice, value and so on)
   * @param {Object} config - {@link CrossChain#config config} of cross chain used.
   */
  constructor(input,config) {
    super(input,config);
    this.input.chainType = config.dstChainType;
    this.input.keystorePath = config.dstKeyStorePath;
  }

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  createDataCreator(){
    logger.debug("Entering CrossChainEthRedeem::createDataCreator");
    this.retResult.code = true;
    this.retResult.result = new RedeemTxEthDataCreator(this.input,this.config);
    return this.retResult;
  }

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  createDataSign(){
    logger.debug("Entering CrossChainEthRedeem::createDataSign");

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
    let record = global.wanDb.getItem(this.config.crossCollection,{x:this.input.x});

    record.status         = CrossStatus.RedeemSending;
    logger.info("CrossChainEthRedeem::preSendTrans");
    logger.info("collection is :",this.config.crossCollection);
    logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.crossCollection,{x:record.x},record);
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
    logger.info("CrossChainEthRedeem::transFailed");
    logger.info("collection is :",this.config.crossCollection);
    logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
    this.retResult.code = true;
    return this.retResult;
  }

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  postSendTrans(resultSendTrans){
    logger.debug("Entering CrossChainEthRedeem::postSendTrans");
    let txHash  = resultSendTrans;
    let x       = this.input.x;
    let record  = global.wanDb.getItem(this.config.crossCollection,{x:x});
    record.status = CrossStatus.RedeemSent;
    record.redeemTxHash = txHash;

    logger.info("CrossChainEthRedeem::postSendTrans");
    logger.info("collection is :",this.config.crossCollection);
    logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.crossCollection,{x:record.x},record);
    this.retResult.code = true;
    return this.retResult;
  }
}

module.exports = CrossChainEthRedeem;
