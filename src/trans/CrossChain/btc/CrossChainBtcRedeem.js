'use strict'
let     BtcTransaction          = require('../../Transaction/btc/BtcTransaction');
let     BtcDataSign             = require('../../DataSign/btc/BtcDataSign');
let     RedeemTxBtcDataCreator  = require('../../TxDataCreator/btc/LockTxBtcDataCreator');
let     CrossChain              = require('../common/CrossChain');
let     errorHandle             = require('../../transUtil').errorHandle;
let     retResult               = require('../../transUtil').retResult;
class CrossChainBtcRedeem extends CrossChain{
  constructor(input,config) {
    super(input,config);
  }
  createTrans(){
    retResult.code = true;
    retResult.result = new BtcTransaction(this.input,this.config);
    return retResult;
  }
  createDataCreator(){
    global.logger.debug("Entering CrossChainBtcRedeem::createDataCreator");
    retResult.code = true;
    retResult.result = new RedeemTxBtcDataCreator(this.input,this.config);
    return retResult;
  }
  createDataSign(){
    global.logger.debug("Entering CrossChainBtcRedeem::createDataSign");
    retResult.code = true;
    retResult.result = new BtcDataSign(this.input,this.config);
    return retResult;
  }

  postSendTrans(){
    global.logger.debug("Entering CrossChainBtcRedeem::postSendTrans");
    retResult.code = true;
    return retResult;
  }
}

module.exports = CrossChainBtcRedeem;
