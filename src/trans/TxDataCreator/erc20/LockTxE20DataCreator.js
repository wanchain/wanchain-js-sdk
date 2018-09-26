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
    global.logger.debug("Entering LockTxE20DataCreator::createCommonData");

    retResult.code      = true;
    let  commonData     = {};
    commonData.from     = this.input.from;
    commonData.to       = this.config.midSCAddr;
    commonData.value    = 0;
    commonData.gasPrice = ccUtil.getGWeiToWei(this.input.gasPrice);
    commonData.gasLimit = Number(this.input.gasLimit);
    commonData.gas      = Number(this.input.gasLimit);
    commonData.nonce    = null;
    try{
      if(this.input.hasOwnProperty('testOrNot')){
        commonData.nonce  = ccUtil.getNonceTest();
      }else{
        commonData.nonce  = await ccUtil.getNonce(commonData.from,this.input.chainType);
      }
      //commonData.nonce  = await ccUtil.getNonce(commonData.from,this.input.chainType);
      global.logger.debug("nonce:is ",commonData.nonce);
    }catch(error){
      global.logger.debug("error:",error);
      retResult.code      = false;
      retResult.result    = error;
    }
    commonData.x      = this.input.x;
    commonData.hashX  = this.input.hashX;
    global.logger.debug("x:",commonData.x);
    global.logger.debug("hash x:",commonData.hashX);

    if(this.input.chainType === 'WAN'){
      commonData.Txtype = '0x01';
      //let coin2WanRatio = global.coin2WanRatio;
      let coin2WanRatio = this.config.token2WanRatio;
      let txFeeRatio    = this.input.txFeeRatio;
      global.logger.debug("amount:coin2WanRatio:txFeeRatio",Number(this.input.amount), coin2WanRatio, txFeeRatio);
      let value         = ccUtil.calculateLocWanFee(Number(this.input.amount), coin2WanRatio, txFeeRatio);
      global.logger.debug("amount:coin2WanRatio:txFeeRatio:Fee",Number(this.input.amount), coin2WanRatio, txFeeRatio, value);
      commonData.value  = value;
    }
    retResult.result  = commonData;
    return Promise.resolve(retResult);
  }
  createContractData(){
    global.logger.debug("Entering LockTxE20DataCreator::createContractData");
    try{
      if(this.input.chainType === 'WAN'){
        let data = ccUtil.getDataByFuncInterface(this.config.midSCAbi,
          this.config.midSCAddr,
          this.config.lockScFunc,
          this.config.srcSCAddr,
          this.input.hashX,
          this.input.storeman,
          this.input.to,
          ccUtil.getWei(this.input.amount)
        );
        retResult.result    = data;
        retResult.code      = true;
      }else{
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
      }

    }catch(error){
      global.logger.debug("createContractData: error: ",error);
      retResult.result      = error;
      retResult.code        = false;
    }
    return retResult;
  }
}

module.exports = LockTxE20DataCreator;