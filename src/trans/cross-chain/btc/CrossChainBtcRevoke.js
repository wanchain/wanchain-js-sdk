'use strict'
let     BtcTransaction          = require('../../transaction/btc/BtcTransaction');
let     BtcDataSign             = require('../../data-sign/btc/BtcDataSign');
let     RevokeTxBtcDataCreator  = require('../../tx-data-creator/btc/RevokeTxBtcDataCreator');
let     CrossChain              = require('../common/CrossChain');
let     errorHandle             = require('../../transUtil').errorHandle;
let     retResult               = require('../../transUtil').retResult;
class CrossChainBtcRevoke extends CrossChain{
  constructor(input,config) {
    super(input,config);
  }
  createTrans(){
    retResult.code = true;
    retResult.result = new BtcTransaction(this.input,this.config);
    return retResult;
  }
  createDataCreator(){
    global.logger.debug("Entering CrossChainBtcRevoke::createDataCreator");
    retResult.code = true;
    retResult.result = new RevokeTxBtcDataCreator(this.input,this.config);
    return retResult;
  }
  createDataSign(){
    global.logger.debug("Entering CrossChainBtcRevoke::createDataSign");
    retResult.code = true;
    retResult.result = new BtcDataSign(this.input,this.config);
    return retResult;
  }

  postSendTrans(){
    global.logger.debug("Entering CrossChainBtcRevoke::postSendTrans");
    retResult.code = true;
    return retResult;
  }
}

module.exports = CrossChainBtcRevoke;
