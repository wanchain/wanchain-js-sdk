'use strict'
let     Transaction           = require('../Transaction/common/Transaction.js');
let     BtcDataSign           = require('../../DataSign/btc/BtcDataSign');
let     LockTxBtcDataCreator  = require('../../TxDataCreator/btc/LockTxBtcDataCreator.js');
let     CrossChain            = require('../common/CrossChain');
let     errorHandle           = require('../../transUtil.js').errorHandle;
let     retResult             = require('../../transUtil.js').retResult;
class CrossChainBtcLock extends CrossChain{
  constructor(input,config) {
    super(input,config);
  }

  createDataCreator(){
    retResult.code = true;
    retResult.result = new LockTxBtcDataCreator(this.input,this.config);
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
exports.CrossChainBtcLock = CrossChainBtcLock;
