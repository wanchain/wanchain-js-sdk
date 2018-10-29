'use strict'
let     errorHandle   = require('../../transUtil').errorHandle;
let     retResult     = require('../../transUtil').retResult;
let     TxDataCreator = require('../common/TxDataCreator');
let     ccUtil        = require('../../../api/ccUtil');
/**
 * @class
 * @augments  TxDataCreator
 */
class RevokeTxE20DataCreator extends TxDataCreator{
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
    global.logger.debug("Entering RedeemTxE20DataCreator::createCommonData");

    let record          = global.wanDb.getItem(this.config.crossCollection,{hashX:this.input.hashX});
    this.input.x        = record.x;
    retResult.code      = true;

    let  commonData     = {};
    commonData.from     = record.from;
    commonData.to       = this.config.midSCAddr;
    commonData.value    = 0;
    commonData.gasPrice = ccUtil.getGWeiToWei(this.input.gasPrice);
    commonData.gasLimit = Number(this.input.gasLimit);
    commonData.gas      = Number(this.input.gasLimit);
    commonData.nonce    = null;

    try{
      //commonData.nonce  = await ccUtil.getNonce(commonData.from,this.input.chainType);
      if(this.input.hasOwnProperty('testOrNot')){
        commonData.nonce  = ccUtil.getNonceTest();
      }else{
        commonData.nonce  = await ccUtil.getNonce(commonData.from,this.input.chainType);
      }
      global.logger.debug("nonce:is ",commonData.nonce);
    }catch(error){
      global.logger.error("error:",error);
      retResult.code      = false;
      retResult.result    = error;
    }
    if(this.input.chainType === 'WAN'){
      commonData.Txtype = '0x01';
    }
    retResult.result  = commonData;
    return Promise.resolve(retResult);
  }

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.retResult|{code, result}}
   */
  createContractData(){
    global.logger.debug("Entering LockTxE20DataCreator::createContractData");
    try{
      let data = ccUtil.getDataByFuncInterface(this.config.midSCAbi,
        this.config.midSCAddr,
        this.config.revokeScFunc,
        this.config.srcSCAddr,                  // parameter
        this.input.hashX                        // parameter
      );
      retResult.result    = data;
      retResult.code      = true;
    }catch(error){
      global.logger.error("createContractData: error: ",error);
      retResult.result      = error;
      retResult.code        = false;
    }
    return retResult;
  }
}

module.exports = RevokeTxE20DataCreator;