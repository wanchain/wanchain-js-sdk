'use strict'
let errorHandle = require('../../transUtil').errorHandle;
let retResult = require('../../transUtil').retResult;
let TxDataCreator = require('../common/TxDataCreator');
let ccUtil = require('../../../api/ccUtil');

class LockTxEthDataCreator extends TxDataCreator {
  constructor(input, config) {
    super(input, config);
  }

  async createCommonData(){
    global.logger.debug("Entering NormalTxE20DataCreator::createCommonData");
    retResult.code      = true;
    let  commonData     = {};
    commonData.from     = this.input.from;
    commonData.to       = this.input.to;
    commonData.value    = ccUtil.getWei(this.input.amount);
    commonData.gasPrice = ccUtil.getGWeiToWei(this.input.gasPrice);
    commonData.gasLimit = Number(this.input.gasLimit);
    commonData.gas      = Number(this.input.gasLimit);
    commonData.nonce    = null; // need todo
    retResult.result    = commonData;
    try{
      retResult.code    = true;

      if(this.input.hasOwnProperty('testOrNot')){
        commonData.nonce  = ccUtil.getNonceTest();
      }else{
        commonData.nonce  = await ccUtil.getNonce(commonData.from,this.input.chainType);
      }
      global.logger.debug("nonce:is ",commonData.nonce);
      global.logger.debug(commonData);
      if(this.input.chainType === 'WAN'){
        commonData.Txtype = '0x01';
      }
      retResult.result  = commonData;
    }catch(error){
      global.logger.debug("error:",error);
      retResult.code      = false;
      retResult.result    = error;
    }
    return Promise.resolve(retResult);
  }
}

module.exports = LockTxEthDataCreator;