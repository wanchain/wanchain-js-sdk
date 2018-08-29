'use strict'
let     Transaction             = require('../Transaction/common/Transaction.js');
let     EthDataSign             = require('../../DataSign/eth/EthDataSign');
let     RevokeTxEthDataCreator  = require('../../TxDataCreator/erc20/RevokeTxEthDataCreator.js');
let     CrossChain              = require('../common/CrossChain');
let     errorHandle             = require('../../transUtil.js').errorHandle;
let     retResult               = require('../../transUtil.js').retResult;
class CrossChainEthRevoke extends CrossChain{
  constructor(input,config) {
    super(input,config);
  }

  createDataCreator(){
    retResult.code = true;
    retResult.result = new RevokeTxEthDataCreator(this.input,this.config);
    return retResult;
  }
  createDataSign(){
    retResult.code = true;
    retResult.result = new EthDataSign(this.input,this.config);
    return retResult;
  }

  postSendTrans(){
    retResult.code = true;
    return retResult;
  }
}
exports.CrossChainEthRevoke = CrossChainEthRevoke;
