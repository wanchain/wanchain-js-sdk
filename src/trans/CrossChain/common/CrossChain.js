'use strict'
let     Transaction     = require('../../Transaction/common/Transaction');
let     DataSign        = require('../../DataSign/common/DataSign');
let     TxDataCreator   = require('../../TxDataCreator/common/TxDataCreator');
let     errorHandle     = require('../../transUtil').errorHandle;
let     retResult       = require('../../transUtil').retResult;
let     ccUtil          = require('../../../api/ccUtil');

class CrossChain {
  constructor(input,config) {
    console.log("=========this.input====================");
    console.log(input);
    this.input          = input;
    this.config         = config;

    this.trans          = null;
    this.dataSign       = null;
    this.txDataCreator  = null;
    this.chainType      = null;
  }
  // used for revoke and refund, to check whether the status and time is ok or not.
  checkPreCondition(){
    retResult.code = true;
    return retResult;
  }
  createTrans(){
    retResult.code = true;
    retResult.result = new Transaction(this.input,this.config);
    return retResult;
  }
  createDataCreator(){
    retResult.code    = true;
    retResult.result  = new TxDataCreator(this.input,this.config);
    return retResult;
  }
  createDataSign(){
    retResult.code    = true;
    retResult.result  = new DataSign(this.input,this.config);
    return retResult;
  }
  sendTrans(data){
    let chainType = this.input.chainType;
    console.log("sendTrans chainType is :",chainType);
    return ccUtil.sendTrans(data,chainType);
  }
  setCommonData(commonData){
    this.trans.setCommonData(commonData);
    retResult.code = true;
    return retResult;
  }
  setContractData(contractData){
    this.trans.setContractData(contractData);
    retResult.code = true;
    return retResult;
  }

  preSendTrans(signedData){
    retResult.code = true;
    return retResult;
  }
  postSendTrans(resultSendTrans){
    retResult.code = true;
    return retResult;
  }
  async run(){
    let ret;
    try{
      console.log("Entering CrossChain::run");

      // step0  : check pre condition
      ret = this.checkPreCondition();
      if(ret.code !== true){
        return ret;
      }

      ret = this.createTrans();
      if(ret.code !== true){
        return ret;
      }else{
        this.trans = ret.result;
      }

      ret = this.createDataCreator();
      if(ret.code !== true){
        return ret;
      }else{
        this.txDataCreator = ret.result;
      }

      ret = this.createDataSign();
      if(ret.code !== true){
        return ret;
      }else{
        this.dataSign = ret.result;
      }

      // step1  : build common data of transaction
      let commonData = null;
      ret = await this.txDataCreator.createCommonData();
      if(ret.code !== true){
        return ret;
      }else{
        commonData = ret.result;
        console.log("CrossChain::run commontdata is:");
        // console.log(commonData);
        this.trans.setCommonData(commonData);
      }

      // step2  : build contract data of transaction
      let contractData = null;
      ret = this.txDataCreator.createContractData();
      if(ret.code !== true){
        return ret;
      }else{
        contractData = ret.result;
        console.log("CrossChain::run contractData is:");
        // console.log(contractData);
        this.trans.setContractData(contractData);
      }

      // step3  : get singedData
      let signedData = null;
      console.log("CrossChain::run before sign trans is:");
      console.log(this.trans);
      ret = this.dataSign.sign(this.trans);
      console.log("CrossChain::run end sign, signed data is:");
      console.log(ret.result);
      if(ret.code !== true){
        return ret;
      }else{
        signedData = ret.result;
      }

      //step4.0 : insert in DB for resending.
      console.log("before preSendTrans:");
      ret = this.preSendTrans(signedData);
      if(ret.code !== true){
        return ret;
      }
      console.log("after preSendTrans:");
      // step4  : send transaction to API server or web3;
      let resultSendTrans;

      resultSendTrans = await this.sendTrans(signedData);
      console.log("result of sendTrans:", resultSendTrans);
      console.log("before postSendTrans");
      this.postSendTrans(resultSendTrans);
      console.log("after postSendTrans");
      // console.log("resultSendTrans :",resultSendTrans);
      ret.code    = true;
      ret.result  = resultSendTrans;

      // step5  : update transaction status in the database
      // ret = this.postSendTrans();
      // if(ret.code !== true) {
      //   errorHandle();
      // }
    }catch(error){
      console.log("error:",error);
      ret.code = false;
      ret.result = error;
      console.log("CrossChain run error:",error);
    }
    return ret;
  }
}

module.exports = CrossChain;
