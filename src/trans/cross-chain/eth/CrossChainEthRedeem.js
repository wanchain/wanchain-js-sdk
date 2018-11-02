'use strict'
let     Transaction             = require('../../transaction/common/Transaction');
let     EthDataSign             = require('../../data-sign/eth/EthDataSign');
let     WanDataSign             = require('../../data-sign/wan/WanDataSign');
let     RedeemTxEthDataCreator  = require('../../tx-data-creator/eth/RedeemTxEthDataCreator');
let     CrossChain              = require('../common/CrossChain');
let     errorHandle             = require('../../transUtil').errorHandle;
let     retResult               = require('../../transUtil').retResult;
let     CrossStatus             = require('../../status/Status').CrossStatus;
let     ccUtil                  = require('../../../api/ccUtil');
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
   * @returns {{code: boolean, result: null}|transUtil.retResult|{code, result}}
   */
  createDataCreator(){
    global.logger.debug("Entering CrossChainEthRedeem::createDataCreator");
    retResult.code = true;
    retResult.result = new RedeemTxEthDataCreator(this.input,this.config);
    return retResult;
  }

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.retResult|{code, result}}
   */
  createDataSign(){
    global.logger.debug("Entering CrossChainEthRedeem::createDataSign");

    retResult.code = true;

    if (this.input.chainType === 'ETH'){
      retResult.result = new EthDataSign(this.input,this.config)
    }else if (this.input.chainType === 'WAN'){
      retResult.result = new WanDataSign(this.input,this.config);
    }else{
      retResult.code = false;
      retResult.result = "chainType is error.";
    }

    return retResult;
  }

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.retResult|{code, result}}
   */
  preSendTrans(signedData){
    let record = global.wanDb.getItem(this.config.crossCollection,{x:this.input.x});

    record.status         = CrossStatus.RedeemSending;
    global.logger.info("CrossChainEthRedeem::preSendTrans");
    global.logger.info("collection is :",this.config.crossCollection);
    global.logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.crossCollection,{x:record.x},record);
    retResult.code = true;
    return retResult;
  }

  /**
   * @override
   */
  transFailed(){
    let hashX  = this.input.hashX;
    let record = global.wanDb.getItem(this.config.crossCollection,{hashX:hashX});
    record.status = CrossStatus.RedeemFail;
    global.logger.info("CrossChainEthRedeem::transFailed");
    global.logger.info("collection is :",this.config.crossCollection);
    global.logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
    retResult.code = true;
    return retResult;
  }

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.retResult|{code, result}}
   */
  postSendTrans(resultSendTrans){
    global.logger.debug("Entering CrossChainEthRedeem::postSendTrans");
    let txHash  = resultSendTrans;
    let x       = this.input.x;
    let record  = global.wanDb.getItem(this.config.crossCollection,{x:x});
    record.status = CrossStatus.RedeemSent;
    record.redeemTxHash = txHash;

    global.logger.info("CrossChainEthRedeem::postSendTrans");
    global.logger.info("collection is :",this.config.crossCollection);
    global.logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.crossCollection,{x:record.x},record);
    retResult.code = true;
    return retResult;
  }
}

module.exports = CrossChainEthRedeem;
