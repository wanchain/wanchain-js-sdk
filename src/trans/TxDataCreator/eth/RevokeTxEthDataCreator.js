'use strict'
let     errorHandle   = require('../../transUtil').errorHandle;
let     retResult     = require('../../transUtil').retResult;
let     TxDataCreator = require('../common/TxDataCreator');
let     ccUtil        = require('../../../api/ccUtil');

class RevokeTxEthDataCreator extends TxDataCreator{
  constructor(input,config) {
    super(input,config);
  }
  async createCommonData(){
    console.log("Entering RevokeTxEthDataCreator::createCommonData");
    let input = this.input;
    let config = this.config;
    console.log("input:", input);

    if (input.hashX === undefined) {
      retResult.code = false;
      retResult.result = 'The hashX entered is invalid.';
    } else if (input.from === undefined || !ccUtil.isWanAddress(input.from)) {
      retResult.code = false;
      retResult.result = 'The to address entered is invalid.';
    } else if (input.gasPrice === undefined) {
      retResult.code = false;
      retResult.result = 'The gasPrice entered is invalid.';
    } else if (input.gasLimit === undefined) {
      retResult.code = false;
      retResult.result = 'The gasLimit entered is invalid.';
    } else {


      let commonData = {};
      if (input.chainType == 'WAN') {
        commonData.Txtype = "0x01";
      }
      commonData.from = input.from;
      commonData.to = config.srcSCAddr;
      commonData.value = 0;
      commonData.gasPrice = ccUtil.getGWeiToWei(input.gasPrice);
      commonData.gasLimit = Number(input.gasLimit);
      commonData.gas = Number(input.gasLimit);


      try {
        commonData.nonce = await ccUtil.getNonce(commonData.from, input.chainType);
        console.log("nonce:is ", commonData.nonce);

        retResult.result = commonData;
        retResult.code = true;

      } catch (error) {
        console.log("error:", error);
        retResult.code = false;
        retResult.result = error;
      }

    }

    return retResult;
  }
  createContractData(){
    console.log("Entering RevokeTxEthDataCreator::createContractData");
    let input = this.input;

    try {
      let hashX = input.hashX;

      let data = ccUtil.getDataByFuncInterface(
        this.config.dstAbi,
        this.config.dstSCAddr,
        this.config.revokeScFunc,
        hashX
      );
      retResult.code = true;
      retResult.result = data;
    } catch (error) {
      console.log("createContractData: error: ", error);
      retResult.result = error;
      retResult.code = false;
    }
    return retResult;
  }
}

module.exports = RevokeTxEthDataCreator;