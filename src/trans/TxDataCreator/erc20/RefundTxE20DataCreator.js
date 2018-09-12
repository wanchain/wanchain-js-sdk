'use strict'
let     errorHandle   = require('../../transUtil').errorHandle;
let     retResult     = require('../../transUtil').retResult;
let     TxDataCreator = require('../common/TxDataCreator');
let     ccUtil        = require('../../../api/ccUtil');

class RefundTxE20DataCreator extends TxDataCreator{
  constructor(input,config) {
    super(input,config);
  }
  async createCommonData(){
    console.log("Entering RefundTxE20DataCreator::createCommonData");
    let record          = global.wanDb.getItem(this.config.crossCollection,{hashX:this.input.hashX});
    this.input.x        = record.x;
    retResult.code      = true;

    let  commonData     = {};
    commonData.from     = record.to;
    commonData.to       = this.config.midSCAddr;
    commonData.value    = 0;
    commonData.gasPrice = Number(this.input.gasPrice);
    commonData.gasLimit = Number(this.input.gasLimit);
    commonData.gas      = Number(this.input.gasLimit);
    commonData.nonce    = null;

    try{
      commonData.nonce  = await ccUtil.getNonce(commonData.from,this.input.chainType);
      console.log("nonce:is ",commonData.nonce);
    }catch(error){
      console.log("error:",error);
      retResult.code      = false;
      retResult.result    = error;
    }
    if(this.input.chainType !== 'WAN'){
      commonData.Txtype = '0x01';
    }
    retResult.result  = commonData;
    //this.config.srcKeystorePath = this.config.dstKeyStorePath;
    return Promise.resolve(retResult);
  }
  createContractData(){
    console.log("Entering LockTxE20DataCreator::createContractData");
    try{
      let data = ccUtil.getDataByFuncInterface(this.config.midSCAbi,
        this.config.midSCAddr,
        this.config.refundScFunc,
        this.config.dstSCAddr,              // parameter
        this.input.x                        // parameter
      );
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

module.exports = RefundTxE20DataCreator;