'use strict'
let     BtcTransaction        = require('../../transaction/btc/BtcTransaction');
let     BtcDataSign           = require('../../data-sign/btc/BtcDataSign');
let     LockTxBtcDataCreator  = require('../../tx-data-creator/btc/LockTxBtcDataCreator');
let     CrossChain            = require('../common/CrossChain');

class CrossChainBtcLock extends CrossChain{
  constructor(input,config) {
    super(input,config);
  }
  createTrans(){
    this.retResult.code = true;
    this.retResult.result = new BtcTransaction(this.input,this.config);
    return this.retResult;
  }
  createDataCreator(){
    global.logger.debug("Entering CrossChainBtcLock::createDataCreator");
    this.retResult.code = true;
    this.retResult.result = new LockTxBtcDataCreator(this.input,this.config);
    return this.retResult;
  }
  createDataSign(){
    global.logger.debug("Entering CrossChainBtcLock::createDataSign");
    this.retResult.code = true;
    this.retResult.result = new BtcDataSign(this.input,this.config);
    return this.retResult;
  }

  postSendTrans(){
    global.logger.debug("Entering CrossChainBtcLock::postSendTrans");
    this.retResult.code = true;
    return this.retResult;
  }
}
module.exports = CrossChainBtcLock;
