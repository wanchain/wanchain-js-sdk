'use strict'
let     BtcTransaction        = require('../../transaction/btc/BtcTransaction');
let     BtcDataSign           = require('../../data-sign/btc/BtcDataSign');
let     LockTxBtcDataCreator  = require('../../tx-data-creator/btc/LockTxBtcDataCreator');
let     CrossChain            = require('../common/CrossChain');
let     errorHandle           = require('../../transUtil').errorHandle;
let     retResult             = require('../../transUtil').retResult;
class CrossChainBtcLock extends CrossChain{
  constructor(input,config) {
    super(input,config);
  }
  createTrans(){
    retResult.code = true;
    retResult.result = new BtcTransaction(this.input,this.config);
    return retResult;
  }
  createDataCreator(){
    global.logger.debug("Entering CrossChainBtcLock::createDataCreator");
    retResult.code = true;
    retResult.result = new LockTxBtcDataCreator(this.input,this.config);
    return retResult;
  }
  createDataSign(){
    global.logger.debug("Entering CrossChainBtcLock::createDataSign");
    retResult.code = true;
    retResult.result = new BtcDataSign(this.input,this.config);
    return retResult;
  }

  postSendTrans(){
    global.logger.debug("Entering CrossChainBtcLock::postSendTrans");
    retResult.code = true;
    return retResult;
  }
}
module.exports = CrossChainBtcLock;
