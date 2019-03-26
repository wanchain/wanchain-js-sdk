'use strict'
let     TxDataCreator = require('../common/TxDataCreator');
let     ccUtil        = require('../../../api/ccUtil');
let     utils         = require('../../../util/util');

let logger = utils.getLogger('LockTxE20DataCreator.js');
/**
 * @class
 * @augments  TxDataCreator
 */
class LockTxE20DataCreator extends TxDataCreator{
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
    logger.debug("Entering LockTxE20DataCreator::createCommonData");

    this.retResult.code      = true;
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
        //commonData.nonce  = await ccUtil.getNonce(commonData.from,this.input.chainType,true);
        let nonce = Number(this.input.approveNonce);
        logger.info("approveNonce = ",this.input.approveNonce);
        logger.info("nonce = ",this.input.approveNonce);
        //commonData.nonce  = nonce + 1;
        commonData.nonce  = await ccUtil.getNonceByLocal(commonData.from,this.input.chainType);
        logger.info("LockTxE20DataCreator::createCommonData getNonceByLocal,%s",commonData.nonce);
      }
      logger.info("nonce:is ",commonData.nonce);
    }catch(error){
      logger.error("error:",error);
      this.retResult.code      = false;
      this.retResult.result    = error;
    }
    commonData.x      = this.input.x;
    commonData.hashX  = this.input.hashX;
    //logger.debug("x:",commonData.x);
    logger.debug("hash x:",commonData.hashX);

    if(this.input.chainType === 'WAN'){
      commonData.Txtype = '0x01';
      //let coin2WanRatio = global.coin2WanRatio;
      let coin2WanRatio = this.config.token2WanRatio;
      let txFeeRatio    = this.input.txFeeRatio;
      logger.info("amount:coin2WanRatio:txFeeRatio",Number(this.input.amount), coin2WanRatio, txFeeRatio);
      let value         = ccUtil.calculateLocWanFee(Number(this.input.amount), coin2WanRatio, txFeeRatio);
      logger.info("amount:coin2WanRatio:txFeeRatio:Fee",Number(this.input.amount), coin2WanRatio, txFeeRatio, value);
      commonData.value  = value;
    }
    this.retResult.result  = commonData;
    return Promise.resolve(this.retResult);
  }

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  createContractData(){
    logger.debug("Entering LockTxE20DataCreator::createContractData");
    try{
      if(this.input.chainType === 'WAN'){
        let data = ccUtil.getDataByFuncInterface(this.config.midSCAbi,
          this.config.midSCAddr,
          this.config.lockScFunc,
          this.config.srcSCAddr,
          this.input.hashX,
          this.input.storeman,
          this.input.to,
          ccUtil.tokenToWeiHex(this.input.amount,this.config.tokenDecimals)
        );
        this.retResult.result    = data;
        this.retResult.code      = true;
      }else{
        let data = ccUtil.getDataByFuncInterface(this.config.midSCAbi,
          this.config.midSCAddr,
          this.config.lockScFunc,
          this.config.srcSCAddr,
          this.input.hashX,
          this.input.storeman,
          this.input.to,
          ccUtil.tokenToWeiHex(this.input.amount,this.config.tokenDecimals)
          );
        this.retResult.result    = data;
        this.retResult.code      = true;
      }

    }catch(error){
      logger.error("createContractData: error: ",error);
      this.retResult.result      = error;
      this.retResult.code        = false;
    }
    return this.retResult;
  }
}

module.exports = LockTxE20DataCreator;
