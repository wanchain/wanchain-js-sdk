'use strict'
let     BtcTransaction        = require('../../Transaction/btc/BtcTransaction');
let     BtcDataSign           = require('../../DataSign/btc/BtcDataSign');
let     LockTxBtcDataCreator  = require('../../TxDataCreator/btc/LockTxBtcDataCreator');
let     NormalChain            = require('../common/NormalChain');
let     errorHandle           = require('../../transUtil').errorHandle;
let     retResult             = require('../../transUtil').retResult;
class NormalChainBtc extends NormalChain{
  constructor(input,config) {
    super(input,config);
  }
  createTrans(){
    retResult.code = true;
    retResult.result = new BtcTransaction(this.input,this.config);
    return retResult;
  }
  createDataCreator(){
    global.logger.debug("Entering NormalChainBtc::createDataCreator");
    retResult.code    = true;
    retResult.result  = new LockTxBtcDataCreator(this.input,this.config);
    return retResult;
  }
  createDataSign(){
    global.logger.debug("Entering NormalChainBtc::createDataSign");
    retResult.code    = true;
    retResult.result  = new BtcDataSign(this.input,this.config);
    return retResult;
  }

  postSendTrans(){
    global.logger.debug("Entering NormalChainBtc::postSendTrans");
    retResult.code   = true;
    return retResult;
  }
}
module.exports = NormalChainBtc;
