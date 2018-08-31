'use strict'
let     Transaction             = require('../../Transaction/common/Transaction');
let     EthDataSign             = require('../../DataSign/eth/EthDataSign');
let     RevokeTxEthDataCreator  = require('../../TxDataCreator/eth/RevokeTxEthDataCreator');
let     CrossChain              = require('../common/CrossChain');
let     errorHandle             = require('../../transUtil').errorHandle;
let     retResult               = require('../../transUtil').retResult;
class CrossChainEthRevoke extends CrossChain{
  constructor(input,config) {
    super(input,config);
  }

  createDataCreator(){
    console.log("Entering CrossChainEthRevoke::createDataCreator");
    retResult.code = true;
    retResult.result = new RevokeTxEthDataCreator(this.input,this.config);
    return retResult;
  }
  createDataSign(){
    console.log("Entering CrossChainEthRevoke::createDataSign");
    retResult.code = true;
    retResult.result = new EthDataSign(this.input,this.config);
    return retResult;
  }

  postSendTrans(){
    console.log("Entering CrossChainEthRevoke::postSendTrans");
    retResult.code = true;
    return retResult;
  }
}

module.exports = CrossChainEthRevoke;
