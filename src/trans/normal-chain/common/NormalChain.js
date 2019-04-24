'use strict'
let Transaction   = require('../../transaction/common/Transaction');
let DataSign      = require('../../data-sign/common/DataSign');
let TxDataCreator = require('../../tx-data-creator/common/TxDataCreator');
let errorHandle   = require('../../transUtil').errorHandle;
let retResult     = require('../../transUtil').retResult;
let ccUtil        = require('../../../api/ccUtil');
let wanUtil       = require('../../../util/util');

let logger = wanUtil.getLogger('NormalChain.js');

/**
 * @class
 * @classdesc  class used to transfer coin or token on the same chain.
 */
class NormalChain {
  /**
   * @constructor
   * @param {Object} input  - {@link CrossChain#input input} of final users.(gas, gasPrice, value and so on)
   * @param {Object} config - {@link CrossChain#config config} of cross chain used.
   */
  constructor(input,config) {
    logger.debug("input: ", wanUtil.hiddenProperties(input,['password','x', 'keypair']));
    let self = this;
    self.retResult = {};
    Object.assign(self.retResult,retResult);
    this.input          = input;
    this.config         = config;

    this.trans          = null;
    this.dataSign       = null;
    this.txDataCreator  = null;
    this.chainType      = null;

    this.input.chainType    = config.srcChainType;
    this.input.keystorePath = config.srcKeystorePath;

    let x               = ccUtil.generatePrivateKey();
    this.input.hashX    = ccUtil.getHashKey(x);

  }

  /**
   * Same with {@link CrossChain#checkPreCondition CrossChain#checkPreCondition}
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  checkPreCondition(){
    this.retResult.code = true;
    return this.retResult;
  }

  /**
   * Same with {@link CrossChain#createTrans CrossChain#createTrans}
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  createTrans(){
    this.retResult.code    = true;
    this.retResult.result  = new Transaction(this.input,this.config);
    return this.retResult;
  }

  /**
   * Same with {@link CrossChain#createDataCreator CrossChain#createDataCreator}
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  createDataCreator(){
    this.retResult.code    = true;
    this.retResult.result  = new TxDataCreator(this.input,this.config);
    return this.retResult;
  }

  /**
   * Same with {@link CrossChain#createDataSign CrossChain#createDataSign}
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  createDataSign(){
    this.retResult.code    = true;
    this.retResult.result  = new DataSign(this.input,this.config);
    return this.retResult;
  }

  /**
   * Same with {@link CrossChain#sendTrans CrossChain#sendTrans}
   * @returns {*}
   */
  sendTrans(data){
    let chainType = this.input.chainType;
    logger.debug("sendTrans chainType is :",chainType);
    logger.debug("sendTrans useLocalNode is :",this.config.useLocalNode);
    if( (chainType === 'WAN') && ( this.config.useLocalNode === true)){
      return ccUtil.sendTransByWeb3(data);
    }
    return ccUtil.sendTrans(data,chainType);
  }

  /**
   * Same with {@link CrossChain#setCommonData CrossChain#setCommonData}
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  setCommonData(commonData){
    this.trans.setCommonData(commonData);
    this.retResult.code = true;
    return this.retResult;
  }

  /**
   * Same with {@link CrossChain#setContractData CrossChain#setContractData}
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  setContractData(contractData){
    this.trans.setContractData(contractData);
    this.retResult.code = true;
    return this.retResult;
  }

  /**
   * Same with {@link CrossChain#preSendTrans CrossChain#preSendTrans}
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  preSendTrans(signedData){
    this.retResult.code = true;
    return this.retResult;
  }

  /**
   * Send transaction failed. update transaction status.
   */
  transFailed(){
    this.retResult.code = true;
    return this.retResult;
  }

  /**
   * Same with {@link CrossChain#postSendTrans CrossChain#postSendTrans}
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  postSendTrans(resultSendTrans){
    this.retResult.code = true;
    return this.retResult;
  }
  async addNonceHoleToList(){
    try{
      logger.info("NormalChain:addNonceHoleToList  addr,chainType,nonce",
        this.trans.commonData.from,
        this.input.chainType,
        this.trans.commonData.nonce);
      await ccUtil.addNonceHoleToList(this.trans.commonData.from,this.input.chainType,this.trans.commonData.nonce);
    }catch(err){
      logger.error("CrossChain:addNonceHoleToList error!",err);
    }
  }

    handleSendTranError(err) {
        return false;
    }

  /**
   * Main process of normal transaction
   * @returns {Promise<*>}
   */
  async run(){
    let ret;
    let signedData = null;
    try{
      logger.debug("Entering NormalChain::run");

      // step0  : check pre condition
      ret = this.checkPreCondition();
      if(ret.code !== true){
        logger.debug("result from checkPreCondition is :",ret.result);
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
        await this.addNonceHoleToList();
        return ret;
      }else{
        commonData = ret.result;
        logger.info("NormalChain::run commonData is:", commonData);
        this.trans.setCommonData(commonData);
      }

      // step2  : build contract data of transaction
      let contractData = null;
      ret = await this.txDataCreator.createContractData();
      if(ret.code !== true){
        await this.addNonceHoleToList();
        return ret;
      }else{
        contractData = ret.result;
        logger.debug("NormalChain::run contractData is:");
        //logger.debug(contractData);
        logger.debug(ccUtil.hiddenProperties2(contractData, ['keypair']));
        this.trans.setContractData(contractData);
      }
    }catch(error){
      logger.error("Caught error when building contract: ",error);
      ret.code = false;
      ret.result = error;
      logger.error("NormalChain run error:",error);
      await this.addNonceHoleToList();
      return ret;
    }
    try{
      // step3  : get singedData
      // logger.debug("NormalChain::run before sign trans is:");
      // logger.debug(this.trans);
      ret = await this.dataSign.sign(this.trans);
      logger.debug("NormalChain::run end sign, signed data is:");
      logger.debug(ret.result);
      if(ret.code !== true){
        await this.addNonceHoleToList();
        return ret;
      }else{
        signedData = ret.result;
      }
    }catch(error){
      // logger.debug("error:",error);
      ret.code = false;
      ret.result = 'Wrong password';
      logger.error("NormalChain run error:",error);
      await this.addNonceHoleToList();
      return ret;
    }
    try{
      //step4.0 : insert in DB for resending.
      logger.debug("before preSendTrans:");
      ret = this.preSendTrans(signedData);
      if(ret.code !== true){
        await this.addNonceHoleToList();
        return ret;
      }
      logger.debug("after preSendTrans:");

    }catch(error){
      // logger.debug("error:",error);
      ret.code = false;
      ret.result = error;
      logger.error("NormalChain run error:",error);
      await this.addNonceHoleToList();
      return ret;
    }
    // step4  : send transaction to API server or web3;
    let resultSendTrans;
    let sendSuccess = false;
    let tryTimes = wanUtil.getConfigSetting("sdk:config:tryTimes", 3);
    for(let i = 0 ; i< tryTimes;i++){
      try{
        resultSendTrans = await this.sendTrans(signedData);
        sendSuccess     = true;
        ret.result      = resultSendTrans;
        break;
      }catch(error){
        logger.error("NormalChain::run sendTrans error:");
        logger.error("retry time:",i);
        logger.error(error);
        ret.result  = error;
          if (this.handleSendTranError(error)) {
              //
              logger.info("sendTrans error handled!")
              break;
          }
      }
    }
    if(sendSuccess !== true){
      await this.addNonceHoleToList();
      this.transFailed();
      ret.code    = false;
      return ret;
    }
    try{
      logger.info("SendTrans result:", resultSendTrans);
      logger.debug("before postSendTrans");
      this.postSendTrans(resultSendTrans);
      logger.debug("after postSendTrans");
      // logger.debug("resultSendTrans :",resultSendTrans);
      ret.code    = true;
      ret.result  = resultSendTrans;
      // step5  : update transaction status in the database
    }catch(error){
      ret.code    = false;
      ret.result  = error;
      logger.error("postSendTrans error:",error);
    }
    return ret;
  }
}

module.exports = NormalChain;
