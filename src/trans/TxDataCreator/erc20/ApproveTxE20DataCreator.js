'use strict'
let     errorHandle   = require('../../transUtil').errorHandle;
let     retResult     = require('../../transUtil').retResult;
let     TxDataCreator = require('../common/TxDataCreator');
let     ccUtil        = require('../../../api/ccUtil');
class ApproveTxE20DataCreator extends TxDataCreator{
  constructor(input,config) {
    super(input,config);
  }

   async createCommonData(){
    console.log("Entering ApproveTxE20DataCreator::createCommonData");
    retResult.code      = true;
    let  commonData     = {};
    commonData.from     = this.input.from;
    commonData.to       = this.config.srcSCAddr;
    commonData.value    = 0;
    commonData.gasPrice = ccUtil.getGWeiToWei(this.input.gasPrice);
    commonData.gasLimit = Number(this.input.gasLimit);
    commonData.gas      = Number(this.input.gasLimit);
    commonData.nonce    = null; // need todo
    // commonData.nonce    = '0x67'; // need todo     // should be  10 not 0x 16
    retResult.result    = commonData;
    try{
      //commonData.nonce  = await ccUtil.getNonce(commonData.from,this.chainType);
      retResult.result  = commonData;
      retResult.code    = true;
      commonData.nonce  = await ccUtil.getNonce(commonData.from,'ETH');
      console.log("nonce:is ",commonData.nonce);
    }catch(error){
      console.log("error:",error);
      retResult.code      = false;
      retResult.result    = error;
    }
    commonData.x = ccUtil.generatePrivateKey();
    commonData.hashX = ccUtil.getHashKey(commonData.x);
    console.log("x:",commonData.x);
    console.log("hash x:",commonData.hashX);
    console.log("ApproveTxE20DataCreator::CommonData");
    console.log(commonData);
    return Promise.resolve(retResult);
  }
  createContractData(){
    console.log("Entering ApproveTxE20DataCreator::createContractData");
    try{
      let data = ccUtil.getDataByFuncInterface(this.config.srcAbi,
        this.config.srcSCAddr,
        this.config.approveScFunc,
        this.config.midSCAddr,
        ccUtil.getWei(this.input.amount));
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

module.exports = ApproveTxE20DataCreator;