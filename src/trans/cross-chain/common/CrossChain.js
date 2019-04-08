'use strict'
let Transaction   = require('../../transaction/common/Transaction');
let DataSign      = require('../../data-sign/common/DataSign');
let TxDataCreator = require('../../tx-data-creator/common/TxDataCreator');
let errorHandle   = require('../../transUtil').errorHandle;
let retResult     = require('../../transUtil').retResult;
let ccUtil        = require('../../../api/ccUtil');
let utils       = require('../../../util/util');

let logger = utils.getLogger('CrossChain.js');
/**
 * Class representing cross chain
 */
class CrossChain {
  /**
   *@constructs
   * @param {Object} input  - {@link CrossChain#input input} of final users.(gas, gasPrice, value and so on)
   * @param {Object} config - {@link CrossChain#config config} of cross chain used.
   */
  constructor(input,config) {
    logger.info("CrossChain::constructor");
    let self = this;
    self.retResult = {};
    Object.assign(self.retResult,retResult);
    logger.info("=========this.input====================");
    logger.info(JSON.stringify(utils.hiddenProperties(input,['password','x', 'keypair']), null, 4));
    logger.debug("=========this.config====================");
    logger.debug(JSON.stringify(config, null, 4));
    /**
     * Input representing the input data from final users.</br>
     * Example is as followings:</br>
     <pre>
     {
        from: '0xf47a8bb5c9ff814d39509591281ae31c0c7c2f38',
        storeman: '0x41623962c5d44565de623d53eb677e0f300467d2',
        txFeeRatio: '1',
        to: '0x393e86756d8d4cf38493ce6881eb3a8f2966bb27',
        amount: '0.01',
        gasPrice: '10',
        gasLimit: '470000',
        password: '*******'
      }
     </pre>
     *@type {Object}
     */
    this.input          = input;
    /**
     * Final configuration computed by SDK .(computed by src chain, dst chain and so on.</br>
     * Example is as followings:</br>
     <pre>
     {
       srcChain: 'ZRX',
       dstChain: 'WAN',
       tokenSymbol: 'ZRX',
       tokenStand: 'E20',
       useLocalNode: false,
       tokenDecimals: '18',
       srcSCAddr: '0x00f58d6d585f84b2d7267940cede30ce2fe6eae8',
       srcSCAddrKey: '0x00f58d6d585f84b2d7267940cede30ce2fe6eae8',
       midSCAddr: '0x4a8f5dd531e4cd1993b79b23dbda21faacb9c731',
       dstSCAddr: '0xfc0eba261b49763decb6c911146e3cf524fa7ebc',
       dstSCAddrKey: 'WAN',
       srcAbi:
       midSCAbi:
       srcKeystorePath: '/home/jacob/.ethereum/testnet/keystore/',
       dstKeyStorePath: '/home/jacob/.wanchain/testnet/keystore/',
       approveClass: 'CrossChainE20Approve',
       lockClass: 'CrossChainE20Lock',
       redeemClass: 'CrossChainE20Redeem',
       revokeClass: 'CrossChainE20Revoke',
       normalTransClass: 'NormalChainE20',
       approveScFunc: 'approve',
       transferScFunc: 'transfer',
       lockScFunc: 'inboundLock',
       redeemScFunc: 'inboundRedeem',
       revokeScFunc: 'inboundRevoke',
       srcChainType: 'ETH',
       dstChainType: 'WAN',
       crossCollection: 'crossTrans',
       normalCollection: 'normalTrans',
       token2WanRatio: '3000'
     }
     </pre>
     *@type {Object}
     */
    this.config         = config;
    /**
     *
     * @type {Transaction}
     */
    this.trans          = null;
    /**
     *
     * @type {DataSign}
     */
    this.dataSign       = null;
    /**
     *
     * @type {TxDataCreator}
     */
    this.txDataCreator  = null;
    /**
     *
     * @type {enum}
     */
    this.chainType      = null;
  }

  /**
   * used for revoke and redeem, to check whether the status and time is ok or not.
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   * ret.code: true   function success</br>
   * ret.result       result of the function  when ret.code equals true.</br>
   * ret.code: false function failure</br>
   * ret.result       error message of the function when ret.code equals false</br>
   */

  checkPreCondition(){
    this.retResult.code = true;
    return this.retResult;
  }

  /**
   * create empty trans , system will fulfill the data later.
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   * ret.code: true   function success</br>
   * ret.result       result of the function  when ret.code equals true.</br>
   * ret.code: false function failure</br>
   * ret.result       error message of the function when ret.code equals false</br>
   */
  createTrans(){
    this.retResult.code = true;
    this.retResult.result = new Transaction(this.input,this.config);
    return this.retResult;
  }

  /**
   * Generate a creator to create common transaction data and custom data.
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   * ret.code: true   function success</br>
   * ret.result       result of the function  when ret.code equals true.</br>
   * ret.code: false function failure</br>
   * ret.result       error message of the function when ret.code equals false</br>
   */
  createDataCreator(){
    this.retResult.code    = true;
    this.retResult.result  = new TxDataCreator(this.input,this.config);
    return this.retResult;
  }

  /**
   * Generate a signer used to sign the transaction data.
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   * ret.code: true   function success</br>
   * ret.result       result of the function  when ret.code equals true.</br>
   * ret.code: false function failure</br>
   * ret.result       error message of the function when ret.code equals false</br>
   */
  createDataSign(){
    this.retResult.code    = true;
    this.retResult.result  = new DataSign(this.input,this.config);
    return this.retResult;
  }

  /**
   *
   * @param {Object} data  - signed data to be sent.See result of {@link DataSign#sign DataSign#sign}
   * @returns {*}
   * ret.code: true   function success</br>
   * ret.result       result of the function  when ret.code equals true.</br>
   * ret.code: false function failure</br>
   * ret.result       error message of the function when ret.code equals false</br>
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
   * Fulfill the common data of transaction.
   * @param {Object} commonData - see result of {@link TxDataCreator#createCommonData TxDataCreator#createCommonData}
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   * ret.code: true   function success</br>
   * ret.result       result of the function  when ret.code equals true.</br>
   * ret.code: false function failure</br>
   * ret.result       error message of the function when ret.code equals false</br>
   */
  setCommonData(commonData){
    this.trans.setCommonData(commonData);
    this.retResult.code = true;
    return this.retResult;
  }

  /**
   * Fulfill the contract data of transaction.
   * @param {Object} contractData - see result of {@link TxDataCreator#createContractData TxDataCreator#createContractData}
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   * ret.code: true   function success</br>
   * ret.result       result of the function  when ret.code equals true.</br>
   * ret.code: false function failure</br>
   * ret.result       error message of the function when ret.code equals false</br>
   */
  setContractData(contractData){
    this.trans.setContractData(contractData);
    this.retResult.code = true;
    return this.retResult;
  }

  /**
   * First insert transaction info. to db before send transaction.
   * @param {Object}  signedData. See result of {@link DataSign#sign DataSign#sign}
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   * ret.code: true   function success</br>
   * ret.result       result of the function  when ret.code equals true.</br>
   * ret.code: false function failure</br>
   * ret.result       error message of the function when ret.code equals false</br>
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
   * After send transaction, insert transaction information into database.
   * @param {string} resultSendTrans - see result of {@link CrossChain#sendTrans CrossChain#sendTrans}
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   * ret.code: true   function success</br>
   * ret.result       result of the function  when ret.code equals true.</br>
   * ret.code: false function failure</br>
   * ret.result       error message of the function when ret.code equals false</br>
   */
  postSendTrans(resultSendTrans){
    this.retResult.code = true;
    return this.retResult;
  }
  async addNonceHoleToList(){
    try{
      logger.info("CrossChain:addNonceHoleToList  addr,chainType,nonce",
        this.trans.commonData.from,
        this.input.chainType,
        this.trans.commonData.nonce);
      await ccUtil.addNonceHoleToList(this.trans.commonData.from,this.input.chainType,this.trans.commonData.nonce);
    }catch(err){
      logger.error("CrossChain:addNonceHoleToList error!",err);
    }
  }
  /**
   * Main process of cross chain process
   * @returns {Promise<*>}
   */
  async run(){
    let ret = this.retResult;
    let signedData = null;
    try{
      logger.debug("Entering CrossChain::run");

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
        logger.info("CrossChain::run commonData is:");
        logger.info(JSON.stringify(utils.hiddenProperties(commonData,['x']), null, 4));
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
        logger.info("CrossChain::run contractData is:\n", utils.hiddenProperties(contractData, ['keypair']));
        //logger.info(contractData);
        this.trans.setContractData(contractData);
      }
    }catch(error){
      // logger.debug("error:",error);
      ret.code = false;
      ret.result = error;
      logger.error("CrossChain run error:",error);
      await this.addNonceHoleToList();
      return ret;
    }
    try{
      // step3  : get singedData
      // logger.debug("CrossChain::run before sign trans is:");
      // logger.debug(this.trans);
      ret = await this.dataSign.sign(this.trans);
      //logger.debug("CrossChain::run end sign, signed data is:");
      //logger.debug(ret.result);
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
      logger.error("CrossChain run error:",error);
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
      logger.error("CrossChain run error:",error);
      await this.addNonceHoleToList();
      return ret;
    }
    // step4  : send transaction to API server or web3;
    let resultSendTrans;
    let sendSuccess = false;
    let tryTimes = utils.getConfigSetting("sdk:config:tryTimes", 3);
    for(let i = 0 ; i< tryTimes;i++){
      try{
        resultSendTrans = await this.sendTrans(signedData);
        logger.info("resultSendTrans :", resultSendTrans);
        sendSuccess     = true;
        ret.result      = resultSendTrans;
        break;
      }catch(error){
        logger.error("CrossChain::run sendTrans error:");
        logger.error("retry time:",i);
        logger.error(error);
        ret.result  = error;
        // temp fix, when error is "known transaction: 0562fae921d3017b43995be03e0a29b98e49857744e590bedbd956f7fc0e3d8f"
        // sdk handle this type error as success scenario.
        if(error.toString().indexOf("known transaction") !== -1){
          let arr         = [];
          arr             = error.toString().split(':');
          if(arr.length === 2){
            let  hashTx     = arr[1].trim();
            if(hashTx.length === 64){
              resultSendTrans = '0x'+ hashTx;
              logger.info("Pseudo result of sendTrans:", resultSendTrans);
              sendSuccess     = true;
              ret.result      = resultSendTrans;
              break;
            }
          }
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
      logger.info("result of sendTrans:", resultSendTrans);
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

module.exports = CrossChain;
