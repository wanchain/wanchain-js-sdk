'use strict'
let     TxDataCreator = require('../common/TxDataCreator');
let     ccUtil        = require('../../../api/ccUtil');
/**
 * @class
 * @augments  TxDataCreator
 */
class RevokeTxEthDataCreator extends TxDataCreator{
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
   * @returns {Promise<{code: boolean, result: null}|transUtil.this.retResult|{code, result}>}
   */
  async createCommonData(){
    global.logger.debug("Entering RevokeTxEthDataCreator::createCommonData");

    let input = this.input;
    let config = this.config;

    if (input.hashX === undefined) {
      this.retResult.code = false;
      this.retResult.result = 'The hashX entered is invalid.';
    } else if (input.gasPrice === undefined) {
      this.retResult.code = false;
      this.retResult.result = 'The gasPrice entered is invalid.';
    } else if (input.gasLimit === undefined) {
      this.retResult.code = false;
      this.retResult.result = 'The gasLimit entered is invalid.';
    } else {


      let record = global.wanDb.getItem(this.config.crossCollection,{hashX:this.input.hashX});
      let commonData = {};
      if (input.chainType == 'WAN') {
        commonData.Txtype = "0x01";
      }

      commonData.from = record.from;
      commonData.to = config.srcSCAddr;
      commonData.value = 0;
      commonData.gasPrice = ccUtil.getGWeiToWei(input.gasPrice);
      commonData.gasLimit = Number(input.gasLimit);
      commonData.gas = Number(input.gasLimit);


      try {
        commonData.nonce = await ccUtil.getNonceByLocal(commonData.from, input.chainType);
        global.logger.info("RevokeTxEthDataCreator::createCommonData getNonceByLocal,%s",commonData.nonce);
        global.logger.debug("nonce:is ", commonData.nonce);

        this.retResult.result = commonData;
        this.retResult.code = true;

      } catch (error) {
        global.logger.error("error:", error);
        this.retResult.code = false;
        this.retResult.result = error;
      }

    }

    return this.retResult;
  }

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  createContractData(){
    global.logger.debug("Entering RevokeTxEthDataCreator::createContractData");
    let input = this.input;

    try {
      let hashX = input.hashX;

      let data = ccUtil.getDataByFuncInterface(
        this.config.dstAbi,
        this.config.dstSCAddr,
        this.config.revokeScFunc,
        hashX
      );
      this.retResult.code = true;
      this.retResult.result = data;
    } catch (error) {
      global.logger.error("createContractData: error: ", error);
      this.retResult.result = error;
      this.retResult.code = false;
    }
    return this.retResult;
  }
}

module.exports = RevokeTxEthDataCreator;
