'use strict'
let     Transaction               = require('../../Transaction/common/Transaction');
let     E20DataSign               = require('../../DataSign/erc20/E20DataSign');
let     E20DataSignWan            = require('../../DataSign/wan/WanDataSign');
let     LockTxE20DataCreator      = require('../../TxDataCreator/erc20/LockTxE20DataCreator');
let     CrossChain                = require('../common/CrossChain');
let     errorHandle               = require('../../transUtil').errorHandle;
let     retResult                 = require('../../transUtil').retResult;
let     ccUtil                    = require('../../../api/ccUtil');

let     CrossChainE20Approve      = require('./CrossChainE20Approve');

class CrossChainE20Lock extends CrossChain{
  constructor(input,config) {
    super(input,config);
    this.input.chainType = config.srcChainType;
    this.input.hasX = null;     // from approve
    this.input.x    = null;     // from approve
  }

  createDataCreator(){
    console.log("Entering CrossChainE20Lock::createDataCreator");
    retResult.code = true;
    retResult.result = new LockTxE20DataCreator(this.input,this.config);
    return retResult;
  }
  createDataSign(){
    console.log("Entering CrossChainE20Lock::createDataSign");
    retResult.code = true;
    if(this.input.chainType === 'WAN'){
      retResult.result = new E20DataSignWan(this.input,this.config);
    }else{
      retResult.result = new E20DataSign(this.input,this.config);
    }
    return retResult;
  }
  preSendTrans(signedData){
    if(this.input.hasOwnProperty('testOrNot')){
      let record = {
        "hashX" 									:this.trans.commonData.hashX,
        "x" 											:this.trans.commonData.x,
        "from"  									:this.trans.commonData.from,
        "to"  										:this.input.to,
        "storeman" 								:this.input.storeman,
        "value"  									:this.trans.commonData.value,
        "contractValue" 					:ccUtil.getWei(this.input.amount),
        "lockedTime" 							:"",
        "buddyLockedTime" 				:"",
        "srcChainAddr" 						:this.config.srcSCAddrKey,
        "dstChainAddr" 						:this.config.dstSCAddrKey,
        "srcChainType" 						:this.config.srcChainType,
        "dstChainType" 						:this.config.dstChainType,
        "status"  								:"LockSending",
        "approveTxHash" 					:"",
        "lockTxHash" 							:this.trans.commonData.hashX, // will update when sent successfully.,
        "refundTxHash"  					:"",
        "revokeTxHash"  					:"",
        "buddyLockTxHash" 				:"",
        "approveSendTryTimes" 		:0,
        "lockSendTryTimes" 				:0,
        "refundSendTryTimes" 			:0,
        "revokeSendTryTimes" 			:0,
        "signedDataLock" 					:signedData,
        "signedDataApprove" 			:"",
        "signedDataRefund" 				:"",
        "signedDataRevoke" 				:""
      };
      console.log("CrossChainE20Lock::preSendTrans");
      global.wanDb.insertItem(this.config.crossCollection,record);
      retResult.code = true;
      return retResult;
    }else{
      let record = global.wanDb.getItem(this.config.crossCollection,{hashX:this.input.hashX});
      record.signedDataLock = signedData;
      record.status         = 'LockSending';
      console.log("CrossChainE20Lock::preSendTrans");
      console.log("collection is :",this.config.crossCollection);
      console.log("record is :",record);
      global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
      retResult.code = true;
      return retResult;
    }
  }
  postSendTrans(resultSendTrans){
    console.log("Entering CrossChainE20Lock::postSendTrans");
    let txHash = resultSendTrans;
    let record = global.wanDb.getItem(this.config.crossCollection,{hashX:this.input.hashX});
    record.lockTxHash     = txHash;
    record.signedDataLock = '';
    record.status         = 'LockSent';

    console.log("CrossChainE20Lock::postSendTrans");
    console.log("collection is :",this.config.crossCollection);
    console.log("record is :",record);
    global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
    retResult.code = true;
    return retResult;
  }
  async run(){
    let ret;
    let  crossChainE20Approve = new CrossChainE20Approve(this.input,this.config);
    try{
      ret         = await crossChainE20Approve.run();

      let hashX   = crossChainE20Approve.trans.commonData.hashX;
      let x       = crossChainE20Approve.trans.commonData.x;

      if(ret.code === false){
        console.log("before lock, in approve error:",ret.result);
        return ret;
      }
      console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&");
      console.log("hashX:",hashX);
      console.log("x:",x);
      console.log("this.input is :",this.input);

      // for test
      if(this.input.hasOwnProperty('testOrNot')){
        x     = ccUtil.generatePrivateKey();
        hashX = ccUtil.getHashKey(x);
      }

      this.input.hashX  = hashX;
      this.input.x      = x;

      console.log("^^^^^^^^^^before await super.run^^^^^^^^^^^^^^^^^");
      // console.log("CrossChainE20Lock: trans");
      // console.log(this.trans);
      ret = await super.run();
      console.log("^^^^^^^^^^^after await super.run^^^^^^^^^^^^^^^^");
      if(ret.code === true){
        console.log("send lock transaction success!");
      }else{
        console.log("send lock transaction fail!");
        console.log(ret.result);
      }
      return ret;
    }catch(err){
      console.log("CrossChainE20Lock:async run");
      console.log(err);
      ret.code = false;
      ret.result = err;
      return ret;
    }
  }
}

module.exports = CrossChainE20Lock;