'use strict'
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
    this.retResult.code      = true;
    let  commonData     = {};
    commonData.from     = this.input.from;
    if(this.input.chainType === 'WAN'){
      commonData.to       = this.config.buddySCAddr;
    }else{
      commonData.to       = this.config.srcSCAddr;
    }
    commonData.value    = 0;
    commonData.gasPrice = ccUtil.getGWeiToWei(this.input.gasPrice);
    commonData.gasLimit = Number(this.input.gasLimit);
    commonData.gas      = Number(this.input.gasLimit);
    commonData.nonce    = null; // need todo
    this.retResult.result    = commonData;
    try{
      this.retResult.code    = true;

      if(this.input.hasOwnProperty('testOrNot')){
        commonData.nonce  = ccUtil.getNonceTest();
      }else{
        commonData.nonce  = await ccUtil.getNonceByLocal(commonData.from,this.input.chainType);
      }
      global.logger.debug("nonce:is ",commonData.nonce);
      global.logger.debug(commonData);
      if(this.input.chainType === 'WAN'){
        commonData.Txtype = '0x01';
      }
      this.retResult.result  = commonData;
    }catch(error){
      global.logger.error("error:",error);
      this.retResult.code      = false;
      this.retResult.result    = error;
    }
    return Promise.resolve(this.retResult);
  }

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  createContractData(){
    try{
      global.logger.debug("Entering NormalTxE20DataCreator::createContractData");
      let data = ccUtil.getDataByFuncInterface(this.config.srcAbi,
        this.config.srcSCAddr,
        this.config.transferScFunc,
        this.input.to,
        ccUtil.tokenToWeiHex(this.input.amount,this.config.tokenDecimals));
      this.retResult.result    = data;
      this.retResult.code      = true;

    }catch(error){
      global.logger.error("NormalTxE20DataCreator::createContractData: error: ",error);
      this.retResult.result      = error;
      this.retResult.code        = false;
    }
    return this.retResult;
  }
}

module.exports = NormalTxE20DataCreator;