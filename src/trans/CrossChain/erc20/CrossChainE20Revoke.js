'use strict'
let     Transaction             = require('../../Transaction/common/Transaction');
let     E20DataSign             = require('../../DataSign/erc20/E20DataSign');
let     E20DataSignWan          = require('../../DataSign/wan/WanDataSign');
let     RevokeTxE20DataCreator  = require('../../TxDataCreator/erc20/RevokeTxE20DataCreator');
let     CrossChain              = require('../common/CrossChain');
let     errorHandle             = require('../../transUtil').errorHandle;
let     retResult               = require('../../transUtil').retResult;
let     ccUtil                    = require('../../../api/ccUtil');
/**
 * @class
 * @augments CrossChain
 */
class CrossChainE20Revoke extends CrossChain{
  /**
   * @constructor
   * @param {Object} input  - {@link CrossChain#input input}
   * @param {Object} config - {@link CrossChain#config config}
   */
  constructor(input,config) {
    super(input,config);
    this.input.chainType = config.srcChainType;
    this.input.keystorePath = config.srcKeystorePath;
  }
  checkPreCondition(){
    global.logger.debug("CrossChainE20Revoke::checkPreCondition hashX:",this.input.hashX);
    let record = global.wanDb.getItem(this.config.crossCollection,{hashX:this.input.hashX});
    // global.logger.debug("CrossChainE20Revoke::checkPreCondition record.lockedTime,record.buddyLockedTime,record.status");
    // global.logger.debug(record.lockedTime);
    // global.logger.debug(record.buddyLockedTime);
    // global.logger.debug(record.status);
    return ccUtil.canRevoke(record);
  }
  createDataCreator(){
    global.logger.debug("Entering CrossChainE20Revoke::createDataCreator");
    retResult.code  = true;
    retResult.result = new RevokeTxE20DataCreator(this.input,this.config);
    return retResult;
  }
  createDataSign(){
    global.logger.debug("Entering CrossChainE20Revoke::createDataSign");
    retResult.code = true;
    if(this.input.chainType === 'WAN'){
      retResult.result = new E20DataSignWan(this.input,this.config);
    }else{
      retResult.result = new E20DataSign(this.input,this.config);
    }
    return retResult;
  }

  preSendTrans(signedData){
    let record = global.wanDb.getItem(this.config.crossCollection,{hashX:this.input.hashX});

    record.status         = 'RevokeSending';
    global.logger.info("CrossChainE20Revoke::preSendTrans");
    global.logger.info("collection is :",this.config.crossCollection);
    global.logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
    retResult.code = true;
    return retResult;
  }
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
    retResult.code = true;
    return retResult;
  }
}

module.exports = CrossChainE20Revoke;
