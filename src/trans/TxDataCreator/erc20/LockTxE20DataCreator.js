'use strict'
let     errorHandle   = require('../../transUtil').errorHandle;
let     retResult     = require('../../transUtil').retResult;
let     TxDataCreator = require('../common/TxDataCreator');
let     ccUtil        = require('../../../api/ccUtil');

class LockTxE20DataCreator extends TxDataCreator{
  constructor(input,config) {
    super(input,config);
  }
  async createCommonData(){
    console.log("Entering LockTxE20DataCreator::createCommonData");
    retResult.code      = true;
    let  commonData     = {};
    commonData.from     = this.input.from;
    commonData.to       = this.config.midSCAddr;
    commonData.value    = 0;
    commonData.gasPrice = ccUtil.getGWeiToWei(this.input.gasPrice);
    //commonData.gasPrice = Number(this.input.gasPrice);
    commonData.gasLimit = Number(this.input.gasLimit);
    commonData.gas      = Number(this.input.gasLimit);
    commonData.nonce    = null;
    try{
      commonData.nonce  = await ccUtil.getNonce(commonData.from,'ETH');
      console.log("nonce:is ",commonData.nonce);
    }catch(error){
      console.log("error:",error);
      retResult.code      = false;
      retResult.result    = error;
    }
    commonData.x      = this.input.x;
    commonData.hashX  = this.input.hashX;
    console.log("x:",commonData.x);
    console.log("hash x:",commonData.hashX);
    retResult.result  = commonData;

    return Promise.resolve(retResult);
  }
  createContractData(){
    console.log("Entering LockTxE20DataCreator::createContractData");
    try{
      let data = ccUtil.getDataByFuncInterface(this.config.midSCAbi,
        this.config.midSCAddr,
        this.config.lockScFunc,
        this.config.srcSCAddr,
        ccUtil.getWei(this.input.amount),
        this.input.hashX,
        this.input.storeman,
        this.input.to);
      retResult.result    = data;
      retResult.code      = true;
    }catch(error){
      console.log("createContractData: error: ",error);
      retResult.result      = error;
      retResult.code        = false;
    }
    return retResult;
  }
}

module.exports = LockTxE20DataCreator;