'use strict'
let     BtcTransaction          = require('../../Transaction/btc/BtcTransaction');
let     BtcDataSign             = require('../../DataSign/btc/BtcDataSign');
let     RefundTxBtcDataCreator  = require('../../TxDataCreator/btc/LockTxBtcDataCreator');
let     CrossChain              = require('../common/CrossChain');
let     errorHandle             = require('../../transUtil').errorHandle;
let     retResult               = require('../../transUtil').retResult;
class CrossChainBtcRefund extends CrossChain{
  constructor(input,config) {
    super(input,config);
  }
  createTrans(){
    retResult.code = true;
    retResult.result = new BtcTransaction(this.input,this.config);
    return retResult;
  }
  createDataCreator(){
    console.log("Entering CrossChainBtcRefund::createDataCreator");
    retResult.code = true;
    retResult.result = new RefundTxBtcDataCreator(this.input,this.config);
    return retResult;
  }
  createDataSign(){
    console.log("Entering CrossChainBtcRefund::createDataSign");
    retResult.code = true;
    retResult.result = new BtcDataSign(this.input,this.config);
    return retResult;
  }

  postSendTrans(){
    console.log("Entering CrossChainBtcRefund::postSendTrans");
    retResult.code = true;
    return retResult;
  }
}

module.exports = CrossChainBtcRefund;
