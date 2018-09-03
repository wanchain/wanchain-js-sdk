'use strict'
let     errorHandle   = require('../../transUtil').errorHandle;
let     retResult     = require('../../transUtil').retResult;
let     TxDataCreator = require('../common/TxDataCreator');
let     ccUtil        = require('../../../api/ccUtil');
let     messageFactory = require('../../../sender/webSocket/messageFactory');
class ApproveTxE20DataCreator extends TxDataCreator{
  constructor(input,config) {
    super(input,config);
  }

   async createCommonData(){
    console.log("Entering ApproveTxE20DataCreator::createCommonData");
    retResult.code      = true;
    let  commonData     = {};
    commonData.from     = this.input.from;
    commonData.to       = this.input.to;
    commonData.value    = 0;
    // commonData.gasPrice = this.input.gasPrice;
    // commonData.gasLimit = this.input.gasLimit;
    commonData.gasPrice = ccUtil.getGWeiToWei(this.input.gasPrice);
    //commonData.gasLimit = ccUtil.getGWeiToWei(this.input.gasLimit);
    commonData.gasLimit = Number(this.input.gasLimit);
    commonData.gas      = Number(this.input.gasLimit);


    commonData.nonce    = null; // need todo
    // commonData.nonce    = '0x67'; // need todo     // should be  10 not 0x 16
    retResult.result    = commonData;
    // messageFactory.getNonce(commonData.from,'ETH',(error,result)=>{
    //   console.log("messageFactory.getNonce");
    //   console.log(error);
    //   console.log(result);
    //
    // });

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

    return Promise.resolve(retResult);
  }
  createContractData(){
    console.log("Entering ApproveTxE20DataCreator::createContractData");
    // let data = ccUtil.getDataByFuncInterface(this.config.srcAbi,
    //   this.config.srcSCAddr,
    //   this.config.approveScFunc,
    //   this.config.midSCAddr,
    //   this.input.amount);
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