'use strict'

let TxDataCreator = require('../common/TxDataCreator');
let ccUtil = require('../../../api/ccUtil');
/**
 * @class
 * @augments  TxDataCreator
 */
class NormalTxEthDataCreator extends TxDataCreator {
  /**
   * @constructor
   * @param {Object} input  - {@link CrossChain#input input} of final users.(gas, gasPrice, value and so on)
   * @param {Object} config - {@link CrossChain#config config} of cross chain used.
   */
  constructor(input, config) {
    super(input, config);
  }

  /**
   * @override
   * @returns {Promise<{code: boolean, result: null}>}
   */
  async createCommonData(){
    global.logger.debug("Entering NormalTxETHDataCreator::createCommonData");
    this.retResult.code      = true;
    let  commonData     = {};
    commonData.from     = this.input.from;
    global.logger.info("this.config.srcChainType= %s,this.config.transferCoin= %s",
      this.config.srcChainType,
      this.config.transferCoin);
    if(this.config.srcChainType === 'WAN' && this.config.transferCoin === false){
      // On WAN, WETH->WETH
      commonData.to       = this.config.tokenScAddr;
      commonData.value    = 0;
    }else{
      commonData.to       = this.input.to;
      commonData.value    = ccUtil.tokenToWeiHex(this.input.amount,this.config.tokenDecimals);
    }
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
        if(this.config.srcChainType === 'WAN' && this.config.useLocalNode === true){
          commonData.nonce  = await ccUtil.getNonceByWeb3(commonData.from);
        }else{
          commonData.nonce  = await ccUtil.getNonceByLocal(commonData.from,this.input.chainType);
        }

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
      global.logger.debug("Entering NormalTxETHDataCreator::createContractData");
      global.logger.info("this.config.srcChainType= %s,this.config.transferCoin= %s",
        this.config.srcChainType,
        this.config.transferCoin);
      if(this.config.srcChainType === 'WAN' && this.config.transferCoin === false){
        // On WAN, WETH->WETH

        let data = ccUtil.getDataByFuncInterface(this.config.tokenScAbi,
          this.config.tokenScAddr,
          this.config.transferScFunc,
          this.input.to,
          ccUtil.tokenToWeiHex(this.input.amount,this.config.tokenDecimals));
        this.retResult.result    = data;
        this.retResult.code      = true;

      }else{

        let data = '0x0';
        this.retResult.result    = data;
        this.retResult.code      = true;

      }

    }catch(error){
      global.logger.error("NormalTxETHDataCreator::createContractData: error: ",error);
      this.retResult.result      = error;
      this.retResult.code        = false;
    }
    return this.retResult;
  }
}
module.exports = NormalTxEthDataCreator;