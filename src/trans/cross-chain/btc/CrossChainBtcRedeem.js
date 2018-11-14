'use strict'
let     BtcTransaction          = require('../../transaction/btc/BtcTransaction');
let     BtcDataSign             = require('../../data-sign/btc/BtcDataSign');
let     RedeemTxBtcDataCreator  = require('../../tx-data-creator/btc/LockTxBtcDataCreator');
let     CrossChain              = require('../common/CrossChain');

class CrossChainBtcRedeem extends CrossChain{
  constructor(input,config) {
    super(input,config);
  }
  createTrans(){
    this.retResult.code = true;
    this.retResult.result = new BtcTransaction(this.input,this.config);
    return this.retResult;
  }
  createDataCreator(){
    global.logger.debug("Entering CrossChainBtcRedeem::createDataCreator");
    this.retResult.code = true;
    this.retResult.result = new RedeemTxBtcDataCreator(this.input,this.config);
    return this.retResult;
  }
  createDataSign(){
    global.logger.debug("Entering CrossChainBtcRedeem::createDataSign");
    this.retResult.code = true;
    this.retResult.result = new BtcDataSign(this.input,this.config);
    return this.retResult;
  }

  postSendTrans(){
    global.logger.debug("Entering CrossChainBtcRedeem::postSendTrans");
    this.retResult.code = true;
    return this.retResult;
  }
}

module.exports = CrossChainBtcRedeem;
