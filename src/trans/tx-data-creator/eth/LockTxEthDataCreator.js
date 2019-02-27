'use strict'
let TxDataCreator = require('../common/TxDataCreator');
let ccUtil = require('../../../api/ccUtil');
/**
 * @class
 * @augments  TxDataCreator
 */
class LockTxEthDataCreator extends TxDataCreator {
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
   * @returns {Promise<{code: boolean, result: null}|transUtil.this.retResult|{code, result}>}
   */
  async createCommonData() {
    global.logger.debug("Entering LockTxEthDataCreator::createCommonData");

    let input = this.input;
    let config = this.config;

    //check input
    if (input.from === undefined || !(ccUtil.isEthAddress(input.from) || ccUtil.isWanAddress(input.to))) {
      this.retResult.code = false;
      this.retResult.result = 'The from address entered is invalid.';
    } else if (input.storeman === undefined) {
      this.retResult.code = false;
      this.retResult.result = 'The storeman entered is invalid.';
    } else if (input.to === undefined || !(ccUtil.isEthAddress(input.from) || ccUtil.isWanAddress(input.to))) {
      this.retResult.code = false;
      this.retResult.result = 'The to address entered is invalid.';
    } else if (input.amount === undefined) {
      this.retResult.code = false;
      this.retResult.result = 'The amount entered is invalid.';
    } else if (input.gasPrice === undefined) {
      this.retResult.code = false;
      this.retResult.result = 'The gasPrice entered is invalid.';
    } else if (input.gasLimit === undefined) {
      this.retResult.code = false;
      this.retResult.result = 'The gasLimit entered is invalid.';
    } else {


      let commonData = {};

      let value;
      if (input.chainType === 'WAN') {
        commonData.Txtype = "0x01";

        let coin2WanRatio = await ccUtil.getEthC2wRatio();
        let txFeeRatio = input.txFeeRatio;
        value = ccUtil.calculateLocWanFee(input.amount, coin2WanRatio, txFeeRatio);
        global.logger.info("amount:coin2WanRatio:txFeeRatio:Fee", input.amount, coin2WanRatio, txFeeRatio, value);

      } else if (input.chainType == 'ETH') {
        value = ccUtil.tokenToWeiHex(input.amount,this.config.tokenDecimals);
      } else {
        this.retResult.code = false;
        this.retResult.result = "source chain is ERROR.";
        return this.retResult;
      }

      commonData.from = input.from;
      commonData.to = config.midSCAddr;
      commonData.value = value;
      commonData.gasPrice = ccUtil.getGWeiToWei(input.gasPrice);
      commonData.gasLimit = Number(input.gasLimit);
      commonData.gas = Number(input.gasLimit);


      try {
        commonData.nonce = await ccUtil.getNonceByLocal(commonData.from, input.chainType);
        global.logger.info("LockTxEthDataCreator::createCommonData getNonceByLocal,%s",commonData.nonce);
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
  createContractData() {
    global.logger.debug("Entering LockTxEthDataCreator::createContractData");
    let input = this.input;


    try {
      let x;
      if (this.input.hasOwnProperty('x')){
          x = this.input.x;
      }else{
          x = ccUtil.generatePrivateKey();
      }
      let hashX = ccUtil.getHashKey(x);

      this.input.x = x;
      this.input.hashX = hashX;

      global.logger.debug("Key:", x);
      global.logger.debug("hashKey:", hashX);
      let data;
      if (input.chainType === 'ETH') {
        data = ccUtil.getDataByFuncInterface(
          this.config.midSCAbi,
          this.config.midSCAddr,
          this.config.lockScFunc,
          hashX,
          input.storeman,
          input.to
        );
      } else if (input.chainType === 'WAN') {
        global.logger.debug(" wan contract ");
        data = ccUtil.getDataByFuncInterface(
          this.config.midSCAbi,
          this.config.midSCAddr,
          this.config.lockScFunc,
          hashX,
          input.storeman,
          input.to,
          ccUtil.tokenToWeiHex(input.amount,this.config.tokenDecimals)
        );
      } else {
        this.retResult.code = false;
        this.retResult.result = "source chain is ERROR.";
        return this.retResult;
      }

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

module.exports = LockTxEthDataCreator;
