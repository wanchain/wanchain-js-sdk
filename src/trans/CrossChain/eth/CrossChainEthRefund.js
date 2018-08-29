'use strict'
let     Transaction             = require('../Transaction/common/Transaction.js');
let     EthDataSign             = require('../../DataSign/eth/EthDataSign');
let     RefundTxEthDataCreator  = require('../../TxDataCreator/erc20/RefundTxEthDataCreator.js');
let     CrossChain              = require('../common/CrossChain');
let     errorHandle             = require('../../transUtil.js').errorHandle;
let     retResult               = require('../../transUtil.js').retResult;
class CrossChainEthRefund extends CrossChain{
  constructor(input,config) {
    super(input,config);
  }

  createDataCreator(){
    retResult.code = true;
    retResult.result = new RefundTxEthDataCreator(this.input,this.config);
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
exports.CrossChainEthRefund = CrossChainEthRefund;
