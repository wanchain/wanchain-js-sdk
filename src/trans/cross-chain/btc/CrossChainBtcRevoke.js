'use strict'
let     BtcTransaction          = require('../../transaction/btc/BtcTransaction');
let     BtcDataSign             = require('../../data-sign/btc/BtcDataSign');
let     RevokeTxBtcDataCreator  = require('../../tx-data-creator/btc/RevokeTxBtcDataCreator');
let     CrossChain              = require('../common/CrossChain');

class CrossChainBtcRevoke extends CrossChain{
  constructor(input,config) {
    super(input,config);
  }
  createTrans(){
    this.retResult.code = true;
    this.retResult.result = new BtcTransaction(this.input,this.config);
    return this.retResult;
  }
  createDataCreator(){
    global.logger.debug("Entering CrossChainBtcRevoke::createDataCreator");
    this.retResult.code = true;
    this.retResult.result = new RevokeTxBtcDataCreator(this.input,this.config);
    return this.retResult;
  }
  createDataSign(){
    global.logger.debug("Entering CrossChainBtcRevoke::createDataSign");
    this.retResult.code = true;
    this.retResult.result = new BtcDataSign(this.input,this.config);
    return this.retResult;
  }

  postSendTrans(){
    global.logger.debug("Entering CrossChainBtcRevoke::postSendTrans");
    this.retResult.code = true;
    return this.retResult;
  }
}

module.exports = CrossChainBtcRevoke;
