'use strict'
let     TxDataCreator = require('../common/TxDataCreator');
let     ccUtil        = require('../../../api/ccUtil');
let     utils         = require('../../../util/util');

let logger = utils.getLogger('NormalTxEosDataCreator.js');

/**
 * @class
 * @augments  TxDataCreator
 */
class NormalTxEosDataCreator extends TxDataCreator{
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
    logger.debug("Entering NormalTxEosDataCreator::createCommonData");
    this.retResult.code      = true;
    let  commonData     = {};
    commonData.from     = this.input.from;
    if(this.input.chainType === 'WAN'){
      commonData.to       = this.config.buddySCAddr;
    }else{
      commonData.to       = this.input.to;
    }
    commonData.value    = this.input.amount + ' EOS';
    // commonData.gasPrice = ccUtil.getGWeiToWei(this.input.gasPrice);
    // commonData.gasLimit = Number(this.input.gasLimit);
    // commonData.gas      = Number(this.input.gasLimit);
    commonData.nonce    = 0; // need todo
    this.retResult.result    = commonData;
    try{
      this.retResult.code    = true;

      // if(this.input.hasOwnProperty('testOrNot')){
      //   commonData.nonce  = ccUtil.getNonceTest();
      // }else{
      //   commonData.nonce  = await ccUtil.getNonceByLocal(commonData.from,this.input.chainType);
      //   logger.info("NormalTxEosDataCreator::createCommonData getNonceByLocal,%s",commonData.nonce);
      // }
      // logger.debug("nonce:is ",commonData.nonce);
      logger.debug(commonData);
      // if(this.input.chainType === 'WAN'){
      //   commonData.Txtype = '0x01';
      // }
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
  async createContractData(){
    try{
      logger.debug("Entering NormalTxEosDataCreator::createContractData");
      let actions = [{
        account: 'eosio.token',
        name: 'transfer',
        authorization: [{
          actor: this.input.from,
          permission: 'active',
        }],
        data: {
          from: this.input.from,
          to: this.input.to,
          quantity: this.input.amount + ' EOS',
          memo: '',
        },
      }];
      let packedTx = await ccUtil.packTrans(actions);
      this.retResult.result    = packedTx;
      this.retResult.code      = true;

    }catch(error){
      logger.error("NormalTxEosDataCreator::createContractData: error: ",error);
      this.retResult.result      = error;
      this.retResult.code        = false;
    }
    return this.retResult;
  }
}

module.exports = NormalTxEosDataCreator;
