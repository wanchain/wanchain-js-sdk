'use strict'
let errorHandle = require('../../transUtil').errorHandle;
let retResult = require('../../transUtil').retResult;
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
   * @returns {Promise<{code: boolean, result: null}|transUtil.retResult|{code, result}>}
   */
  async createCommonData() {
    global.logger.debug("Entering LockTxEthDataCreator::createCommonData");

    let input = this.input;
    let config = this.config;
    global.logger.debug("input:", input);

    //check input
    if (input.from === undefined || !(ccUtil.isEthAddress(input.from) || ccUtil.isWanAddress(input.to))) {
      retResult.code = false;
      retResult.result = 'The from address entered is invalid.';
    } else if (input.storeman === undefined) {
      retResult.code = false;
      retResult.result = 'The storeman entered is invalid.';
    } else if (input.to === undefined || !(ccUtil.isEthAddress(input.from) || ccUtil.isWanAddress(input.to))) {
      retResult.code = false;
      retResult.result = 'The to address entered is invalid.';
    } else if (input.amount === undefined) {
      retResult.code = false;
      retResult.result = 'The amount entered is invalid.';
    } else if (input.gasPrice === undefined) {
      retResult.code = false;
      retResult.result = 'The gasPrice entered is invalid.';
    } else if (input.gasLimit === undefined) {
      retResult.code = false;
      retResult.result = 'The gasLimit entered is invalid.';
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
        retResult.code = false;
        retResult.result = "source chain is ERROR.";
        return retResult;
      }

      commonData.from = input.from;
      commonData.to = config.midSCAddr;
      commonData.value = value;
      commonData.gasPrice = ccUtil.getGWeiToWei(input.gasPrice);
      commonData.gasLimit = Number(input.gasLimit);
      commonData.gas = Number(input.gasLimit);


      try {
        commonData.nonce = await ccUtil.getNonce(commonData.from, input.chainType);
        global.logger.debug("nonce:is ", commonData.nonce);

        retResult.result = commonData;
        retResult.code = true;

      } catch (error) {
        global.logger.error("error:", error);
        retResult.code = false;
        retResult.result = error;
      }

    }

    return retResult;
  }

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.retResult|{code, result}}
   */
  createContractData() {
    global.logger.debug("Entering LockTxEthDataCreator::createContractData");
    let input = this.input;


    try {
      let x = ccUtil.generatePrivateKey();
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
        retResult.code = false;
        retResult.result = "source chain is ERROR.";
        return retResult;
      }

      retResult.code = true;
      retResult.result = data;
    } catch (error) {
      global.logger.error("createContractData: error: ", error);
      retResult.result = error;
      retResult.code = false;
    }

    return retResult;
  }
}

module.exports = LockTxEthDataCreator;