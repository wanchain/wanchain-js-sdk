'use strict'
let     BtcTransaction        = require('../../transaction/btc/BtcTransaction');
let     BtcDataSign           = require('../../data-sign/btc/BtcDataSign');
let     LockTxBtcDataCreator  = require('../../tx-data-creator/btc/LockTxBtcDataCreator');
let     NormalChain            = require('../common/NormalChain');

class NormalChainBtc extends NormalChain{
  constructor(input,config) {
    super(input,config);
  }
  createTrans(){
    this.retResult.code = true;
    this.retResult.result = new BtcTransaction(this.input,this.config);
    return this.retResult;
  }
  createDataCreator(){
    global.logger.debug("Entering NormalChainBtc::createDataCreator");
    this.retResult.code    = true;
    this.retResult.result  = new LockTxBtcDataCreator(this.input,this.config);
    return this.retResult;
  }
  createDataSign(){
    global.logger.debug("Entering NormalChainBtc::createDataSign");
    this.retResult.code    = true;
    this.retResult.result  = new BtcDataSign(this.input,this.config);
    return this.retResult;
  }

  postSendTrans(){
    global.logger.debug("Entering NormalChainBtc::postSendTrans");
    this.retResult.code   = true;
    return this.retResult;
  }
}
module.exports = NormalChainBtc;
