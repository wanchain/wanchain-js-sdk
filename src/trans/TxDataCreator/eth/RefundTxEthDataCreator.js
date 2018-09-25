'use strict'
let     errorHandle   = require('../../transUtil').errorHandle;
let     retResult     = require('../../transUtil').retResult;
let     TxDataCreator = require('../common/TxDataCreator');
let     ccUtil        = require('../../../api/ccUtil');

class RefundTxEthDataCreator extends TxDataCreator{
  constructor(input,config) {
    super(input,config);
  }
  async createCommonData(){
    global.logger.debug("Entering RefundTxEthDataCreator::createCommonData");
    this.config.keystorePath = this.config.dstKeyStorePath;
    let input = this.input;
    let config = this.config;
    global.logger.debug("input:", input);

    if (input.x === undefined) {
      retResult.code = false;
      retResult.result = 'The x entered is invalid.';
    } else if (input.gasPrice === undefined) {
      retResult.code = false;
      retResult.result = 'The gasPrice entered is invalid.';
    } else if (input.gasLimit === undefined) {
      retResult.code = false;
      retResult.result = 'The gasLimit entered is invalid.';
    } else {


      let record = global.wanDb.getItem(this.config.crossCollection,{hashX:this.input.hashX});

      let commonData = {};
      if (input.chainType == 'WAN') {
        commonData.Txtype = "0x01";
      }

      commonData.from = record.to;
      commonData.to = config.dstSCAddr;
      commonData.value = 0;
      commonData.gasPrice = ccUtil.getGWeiToWei(input.gasPrice);
      commonData.gasLimit = Number(input.gasLimit);
      commonData.gas = Number(input.gasLimit);


      try {
        commonData.nonce = await ccUtil.getNonce(commonData.from, input.chainType);
        global.logger.debug("nonce:is ", commonData.nonce);

        retResult.result = commonData;
        retResult.code = true;

      } catch (error) {
        global.logger.debug("error:", error);
        retResult.code = false;
        retResult.result = error;
      }

    }


    return retResult;
  }
  createContractData(){
    global.logger.debug("Entering RefundTxEthDataCreator::createContractData");

    let input = this.input;

    try {
      let x = input.x;

      let data = ccUtil.getDataByFuncInterface(
        this.config.dstAbi,
        this.config.dstSCAddr,
        this.config.refundScFunc,
        x
      );

      retResult.code = true;
      retResult.result = data;
    } catch (error) {
      global.logger.debug("createContractData: error: ", error);
      retResult.result = error;
      retResult.code = false;
    }

    return retResult;
  }
}

module.exports = RefundTxEthDataCreator;