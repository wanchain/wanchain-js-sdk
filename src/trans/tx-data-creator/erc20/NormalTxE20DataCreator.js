'use strict'
let     errorHandle   = require('../../transUtil').errorHandle;
let     retResult     = require('../../transUtil').retResult;
let     TxDataCreator = require('../common/TxDataCreator');
let     ccUtil        = require('../../../api/ccUtil');
/**
 * @class
 * @augments  TxDataCreator
 */
class NormalTxE20DataCreator extends TxDataCreator{
  /**
   * @constructor
   * @param {Object} input  - {@link CrossChain#input input} of final users.(gas, gasPrice, value and so on)
   * @param {Object} config - {@link CrossChain#config config} of cross chain used.
   */
  constructor(input,config) {
    super(input,config);
  }

  /**
   * @override
   * @returns {Promise<{code: boolean, result: null}>}
   */
  async createCommonData(){
    global.logger.debug("Entering NormalTxE20DataCreator::createCommonData");
    retResult.code      = true;
    let  commonData     = {};
    commonData.from     = this.input.from;
    commonData.to       = this.config.srcSCAddr;
    commonData.value    = 0;
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
      global.logger.error("error:",error);
      retResult.code      = false;
      retResult.result    = error;
    }
    return Promise.resolve(retResult);
  }

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.retResult|{code, result}}
   */
  createContractData(){
    try{
      global.logger.debug("Entering NormalTxE20DataCreator::createContractData");
      let data = ccUtil.getDataByFuncInterface(this.config.srcAbi,
        this.config.srcSCAddr,
        this.config.transferScFunc,
        this.input.to,
        ccUtil.tokenToWeiHex(this.input.amount,this.config.tokenDecimals));
      retResult.result    = data;
      retResult.code      = true;

    }catch(error){
      global.logger.error("NormalTxE20DataCreator::createContractData: error: ",error);
      retResult.result      = error;
      retResult.code        = false;
    }
    return retResult;
  }
}

module.exports = NormalTxE20DataCreator;