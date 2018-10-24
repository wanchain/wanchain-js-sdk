'use strict'
let     Transaction             = require('../../Transaction/common/Transaction');
let     EthDataSign             = require('../../DataSign/eth/EthDataSign');
let     WanDataSign             = require('../../DataSign/wan/WanDataSign');
let     LockTxEthDataCreator    = require('../../TxDataCreator/eth/LockTxEthDataCreator');
let     CrossChain              = require('../common/CrossChain');
let     errorHandle             = require('../../transUtil').errorHandle;
let     retResult               = require('../../transUtil').retResult;
let     ccUtil                  = require('../../../api/ccUtil');
let     CrossStatus             = require('../../status/Status').CrossStatus;
/**
 * @class
 * @augments CrossChain
 */
class CrossChainEthLock extends CrossChain{
  /**
   * @constructor
   * @param {Object} input  - {@link CrossChain#input input}
   * @param {Object} config - {@link CrossChain#config config}
   */
  constructor(input,config) {
    super(input,config);
    this.input.chainType = config.srcChainType;
    this.input.keystorePath = config.srcKeystorePath;
  }

  createDataCreator(){
    global.logger.debug("Entering CrossChainEthLock::createDataCreator");
    retResult.code = true;
    retResult.result = new LockTxEthDataCreator(this.input,this.config);
    return retResult;
  }
  createDataSign(){
    global.logger.debug("Entering CrossChainEthLock::createDataSign");

    retResult.code = true;
    if (this.input.chainType === 'ETH'){
      retResult.result = new EthDataSign(this.input,this.config)
    }else if (this.input.chainType === 'WAN'){
      retResult.result = new WanDataSign(this.input,this.config);
    }else{
      retResult.code = false;
      retResult.result = "chainType is error.";
    }

    return retResult;
  }

  preSendTrans(signedData){
    let record = {
      "hashX" 									:this.input.hashX,
      "x" 											:this.input.x,
      "from"  									:this.input.from,
      "to"  										:this.input.to,
      "storeman" 								:this.input.storeman,
      "value"  									:this.trans.commonData.value,
      "contractValue" 					:ccUtil.tokenToWeiHex(this.input.amount,this.config.tokenDecimals),
      "lockedTime" 							:"",
      "buddyLockedTime" 				:"",
      "srcChainAddr" 						:this.config.srcSCAddrKey,
      "dstChainAddr" 						:this.config.dstSCAddrKey,
      "srcChainType" 						:this.config.srcChainType,
      "dstChainType" 						:this.config.dstChainType,
      "status"  								:CrossStatus.LockSending,
      "approveTxHash" 					:"", // will update when sent successfully.
      "lockTxHash" 							:"",
      "redeemTxHash"  					:"",
      "revokeTxHash"  					:"",
      "buddyLockTxHash" 				:"",
      "tokenSymbol"            :this.config.tokenSymbol,
      "tokenStand"             :this.config.tokenStand,
      "htlcTimeOut"            :"", //unit: s
      "buddyLockedTimeOut"     :"",
    };
    global.logger.info("CrossChainEthLock::preSendTrans");
    global.logger.info("collection is :",this.config.crossCollection);
    global.logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.insertItem(this.config.crossCollection,record);
    retResult.code = true;
    return retResult;
  }

  postSendTrans(resultSendTrans){
    global.logger.debug("Entering CrossChainEthLock::postSendTrans");
    let txHash = resultSendTrans;
    let hashX  = this.input.hashX;
    let record = global.wanDb.getItem(this.config.crossCollection,{hashX:hashX});
    record.status = CrossStatus.LockSent;
    record.lockTxHash = txHash;
    global.logger.info("CrossChainEthLock::postSendTrans");
    global.logger.info("collection is :",this.config.crossCollection);
    global.logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
    retResult.code = true;
    return retResult;
  }
}

module.exports = CrossChainEthLock;
