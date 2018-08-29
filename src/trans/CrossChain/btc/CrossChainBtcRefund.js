'use strict'
let     Transaction             = require('../Transaction/common/Transaction.js');
let     BtcDataSign             = require('../../DataSign/btc/BtcDataSign');
let     RefundTxBtcDataCreator  = require('../../TxDataCreator/btc/LockTxBtcDataCreator.js');
let     CrossChain              = require('../common/CrossChain');
let     errorHandle             = require('../../transUtil.js').errorHandle;
let     retResult               = require('../../transUtil.js').retResult;
class CrossChainBtcRefund extends CrossChain{
  constructor(input,config) {
    super(input,config);
  }

  createDataCreator(){
    retResult.code = true;
    retResult.result = new RefundTxBtcDataCreator(this.input,this.config);
    return retResult;
  }
  createDataSign(){
    retResult.code = true;
    retResult.result = new BtcDataSign(this.input,this.config);
    return retResult;
  }

  postSendTrans(){
    retResult.code = true;
    return retResult;
  }
}
exports.CrossChainBtcRefund = CrossChainBtcRefund;
