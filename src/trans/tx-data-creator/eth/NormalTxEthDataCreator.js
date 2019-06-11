'use strict'

let TxDataCreator = require('../common/TxDataCreator');
let ccUtil = require('../../../api/ccUtil');
let wanUtil= require('../../../util/util');

let logger = wanUtil.getLogger('NormalTxEthDataCreator.js');

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
    logger.debug("Entering NormalTxETHDataCreator::createCommonData");
    this.retResult.code      = true;
    let  commonData     = {};
    commonData.from     = this.input.from;
    logger.info("this.config.srcChainType= %s,this.config.transferCoin= %s",
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
          commonData.nonce  = this.input.nonce || await ccUtil.getNonceByWeb3(commonData.from);
          logger.info("NormalTxEthDataCreator::createCommonData getNonceByWeb3,%s",commonData.nonce);
        }else{
          commonData.nonce  = this.input.nonce || await ccUtil.getNonceByLocal(commonData.from,this.input.chainType);
          logger.info("NormalTxEthDataCreator::createCommonData getNonceByLocal,%s",commonData.nonce);
        }

      }
      logger.debug("nonce:is ",commonData.nonce);
      logger.debug(commonData);
      if(this.input.chainType === 'WAN'){
        commonData.Txtype = '0x01';

        if (this.input.hasOwnProperty('chainId')) {
            commonData.chainId = this.input.chainId;
        } else {
            if (wanUtil.isOnMainNet()) {
                commonData.chainId = '0x01';
            } else {
                commonData.chainId = '0x03';
            }
        }
      }
      this.retResult.result  = commonData;
    }catch(error){
      logger.error("error:",error);
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
      logger.debug("Entering NormalTxETHDataCreator::createContractData");
      logger.info("this.config.srcChainType= %s,this.config.transferCoin= %s",
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

        //let data = '0x0';
        let data = null;
        this.retResult.result    = data;
        this.retResult.code      = true;

      }

    }catch(error){
      logger.error("NormalTxETHDataCreator::createContractData: error: ",error);
      this.retResult.result      = error;
      this.retResult.code        = false;
    }
    return this.retResult;
  }
}
module.exports = NormalTxEthDataCreator;
