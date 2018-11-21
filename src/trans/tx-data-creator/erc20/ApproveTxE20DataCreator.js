'use strict'

let     TxDataCreator = require('../common/TxDataCreator');
let     ccUtil        = require('../../../api/ccUtil');

/**
 * @class
 * @augments  TxDataCreator
 */
class ApproveTxE20DataCreator extends TxDataCreator{
  /**
   * @constructor
   * @param {Object} input  - {@link CrossChain#input input} of final users.(gas, gasPrice, value and so on)
   * @param {Object} config - {@link CrossChain#config config} of cross chain used.
   */
  constructor(input,config) {
    super(input,config);
  }

  /**
   * {@link TxDataCreator#createCommonData}
   * @override
   * @returns {Promise<{code: boolean, result: null}>}
   */
  async createCommonData(){
    global.logger.debug("Entering ApproveTxE20DataCreator::createCommonData");

    this.retResult.code      = true;
    let  commonData     = {};
    commonData.from     = this.input.from;
    commonData.to       = this.config.srcSCAddr;
    if(this.input.chainType === 'WAN'){
      commonData.to     = this.config.buddySCAddr;
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
        commonData.nonce  = await ccUtil.getNonce(commonData.from,this.input.chainType);
      }
      global.logger.debug("nonce:is ",commonData.nonce);
      if(this.input.hasOwnProperty('x')){
        commonData.x = this.input.x;
      }else{
        commonData.x = ccUtil.generatePrivateKey();
      }
      commonData.hashX = ccUtil.getHashKey(commonData.x);
      //global.logger.debug("x:",commonData.x);
      global.logger.debug("hash x:",commonData.hashX);
      global.logger.debug("ApproveTxE20DataCreator::CommonData");
      //global.logger.debug(commonData);
      global.logger.debug(ccUtil.hiddenProperties(commonData,['x']));
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
    global.logger.debug("Entering ApproveTxE20DataCreator::createContractData");
    try{
      let data = ccUtil.getDataByFuncInterface(this.config.srcAbi,
        this.config.srcSCAddr,
        this.config.approveScFunc,
        this.config.midSCAddr,
        ccUtil.tokenToWeiHex(this.input.amount,this.config.tokenDecimals));
      this.retResult.result    = data;
      this.retResult.code      = true;
    }catch(error){
      global.logger.error("createContractData: error: ",error);
      this.retResult.result      = error;
      this.retResult.code        = false;
    }
    return this.retResult;
  }
}

module.exports = ApproveTxE20DataCreator;