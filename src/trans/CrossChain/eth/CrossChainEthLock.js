'use strict'
let     Transaction             = require('../../Transaction/common/Transaction');
let     EthDataSign             = require('../../DataSign/eth/EthDataSign');
let     LockTxEthDataCreator    = require('../../TxDataCreator/eth/LockTxEthDataCreator');
let     CrossChain              = require('../common/CrossChain');
let     errorHandle             = require('../../transUtil').errorHandle;
let     retResult               = require('../../transUtil').retResult;
class CrossChainEthLock extends CrossChain{
  constructor(input,config) {
    super(input,config);
  }

  createDataCreator(){
    console.log("Entering CrossChainEthLock::createDataCreator");
    retResult.code = true;
    retResult.result = new LockTxEthDataCreator(this.input,this.config);
    return retResult;
  }
  createDataSign(){
    console.log("Entering CrossChainEthLock::createDataSign");
    retResult.code = true;
    retResult.result = new EthDataSign(this.input,this.config);
    return retResult;
  }

  postSendTrans(){
    console.log("Entering CrossChainEthLock::postSendTrans");
    retResult.code = true;
    return retResult;
  }
}

module.exports = CrossChainEthLock;
