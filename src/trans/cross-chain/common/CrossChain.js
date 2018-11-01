'use strict'
let     Transaction     = require('../../transaction/common/Transaction');
let     DataSign        = require('../../data-sign/common/DataSign');
let     TxDataCreator   = require('../../tx-data-creator/common/TxDataCreator');
let     errorHandle     = require('../../transUtil').errorHandle;
let     retResult       = require('../../transUtil').retResult;
let     ccUtil          = require('../../../api/ccUtil');
let     sdkConfig       = require('../../../conf/config');

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
    global.logger.info("CrossChain::constructor");
    global.logger.info("=========this.input====================");
    global.logger.info(ccUtil.hiddenProperties(input,['password','x']));
    global.logger.info("=========this.config====================");
    global.logger.info(config);
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
   * @returns {{code: boolean, result: null}|transUtil.retResult|{code, result}}
   * ret.code: true   function success</br>
   * ret.result       result of the function  when ret.code equals true.</br>
   * ret.code: false function failure</br>
   * ret.result       error message of the function when ret.code equals false</br>
   */

  checkPreCondition(){
    retResult.code = true;
    return retResult;
  }

  /**
   * create empty trans , system will fulfill the data later.
   * @returns {{code: boolean, result: null}|transUtil.retResult|{code, result}}
   * ret.code: true   function success</br>
   * ret.result       result of the function  when ret.code equals true.</br>
   * ret.code: false function failure</br>
   * ret.result       error message of the function when ret.code equals false</br>
   */
  createTrans(){
    retResult.code = true;
    retResult.result = new Transaction(this.input,this.config);
    return retResult;
  }

  /**
   * Generate a creator to create common transaction data and custom data.
   * @returns {{code: boolean, result: null}|transUtil.retResult|{code, result}}
   * ret.code: true   function success</br>
   * ret.result       result of the function  when ret.code equals true.</br>
   * ret.code: false function failure</br>
   * ret.result       error message of the function when ret.code equals false</br>
   */
  createDataCreator(){
    retResult.code    = true;
    retResult.result  = new TxDataCreator(this.input,this.config);
    return retResult;
  }

  /**
   * Generate a signer used to sign the transaction data.
   * @returns {{code: boolean, result: null}|transUtil.retResult|{code, result}}
   * ret.code: true   function success</br>
   * ret.result       result of the function  when ret.code equals true.</br>
   * ret.code: false function failure</br>
   * ret.result       error message of the function when ret.code equals false</br>
   */
  createDataSign(){
    retResult.code    = true;
    retResult.result  = new DataSign(this.input,this.config);
    return retResult;
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
    global.logger.debug("sendTrans chainType is :",chainType);
    global.logger.debug("sendTrans useLocalNode is :",this.config.useLocalNode);

    if( (chainType === 'WAN') && ( this.config.useLocalNode === true)){
      return ccUtil.sendTransByWeb3(data);
    }
    return ccUtil.sendTrans(data,chainType);
  }

  /**
   * Fulfill the common data of transaction.
   * @param {Object} commonData - see result of {@link TxDataCreator#createCommonData TxDataCreator#createCommonData}
   * @returns {{code: boolean, result: null}|transUtil.retResult|{code, result}}
   * ret.code: true   function success</br>
   * ret.result       result of the function  when ret.code equals true.</br>
   * ret.code: false function failure</br>
   * ret.result       error message of the function when ret.code equals false</br>
   */
  setCommonData(commonData){
    this.trans.setCommonData(commonData);
    retResult.code = true;
    return retResult;
  }

  /**
   * Fulfill the contract data of transaction.
   * @param {Object} contractData - see result of {@link TxDataCreator#createContractData TxDataCreator#createContractData}
   * @returns {{code: boolean, result: null}|transUtil.retResult|{code, result}}
   * ret.code: true   function success</br>
   * ret.result       result of the function  when ret.code equals true.</br>
   * ret.code: false function failure</br>
   * ret.result       error message of the function when ret.code equals false</br>
   */
  setContractData(contractData){
    this.trans.setContractData(contractData);
    retResult.code = true;
    return retResult;
  }

  /**
   * First insert transaction info. to db before send transaction.
   * @param {Object}  signedData. See result of {@link DataSign#sign DataSign#sign}
   * @returns {{code: boolean, result: null}|transUtil.retResult|{code, result}}
   * ret.code: true   function success</br>
   * ret.result       result of the function  when ret.code equals true.</br>
   * ret.code: false function failure</br>
   * ret.result       error message of the function when ret.code equals false</br>
   */
  preSendTrans(signedData){
    retResult.code = true;
    return retResult;
  }

  /**
   * After send transaction, insert transaction information into database.
   * @param {string} resultSendTrans - see result of {@link CrossChain#sendTrans CrossChain#sendTrans}
   * @returns {{code: boolean, result: null}|transUtil.retResult|{code, result}}
   * ret.code: true   function success</br>
   * ret.result       result of the function  when ret.code equals true.</br>
   * ret.code: false function failure</br>
   * ret.result       error message of the function when ret.code equals false</br>
   */
  postSendTrans(resultSendTrans){
    retResult.code = true;
    return retResult;
  }

  /**
   * Main process of cross chain process
   * @returns {Promise<*>}
   */
  async run(){
    let ret = retResult;
    let signedData = null;
    try{
      global.logger.debug("Entering CrossChain::run");

      // step0  : check pre condition
      ret = this.checkPreCondition();
      if(ret.code !== true){
        global.logger.debug("result from checkPreCondition is :",ret.result);
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
        global.logger.debug("CrossChain::run commontdata is:");
        global.logger.debug(ccUtil.hiddenProperties(commonData,['x']));
        this.trans.setCommonData(commonData);
      }

      // step2  : build contract data of transaction
      let contractData = null;
      ret = this.txDataCreator.createContractData();
      if(ret.code !== true){
        return ret;
      }else{
        contractData = ret.result;
        global.logger.debug("CrossChain::run contractData is:");
        global.logger.debug(contractData);
        this.trans.setContractData(contractData);
      }
    }catch(error){
      // global.logger.debug("error:",error);
      ret.code = false;
      ret.result = error;
      global.logger.error("CrossChain run error:",error);
      return ret;
    }
    try{
      // step3  : get singedData
      // global.logger.debug("CrossChain::run before sign trans is:");
      // global.logger.debug(this.trans);
      ret = this.dataSign.sign(this.trans);
      // global.logger.debug("CrossChain::run end sign, signed data is:");
      // global.logger.debug(ret.result);
      if(ret.code !== true){
        return ret;
      }else{
        signedData = ret.result;
      }
    }catch(error){
      // global.logger.debug("error:",error);
      ret.code = false;
      ret.result = 'Wrong password';
      global.logger.error("CrossChain run error:",error);
      return ret;
    }
    try{
      //step4.0 : insert in DB for resending.
      global.logger.debug("before preSendTrans:");
      ret = this.preSendTrans(signedData);
      if(ret.code !== true){
        return ret;
      }
      global.logger.debug("after preSendTrans:");
    }catch(error){
      // global.logger.debug("error:",error);
      ret.code = false;
      ret.result = error;
      global.logger.error("CrossChain run error:",error);
      return ret;
    }
    // step4  : send transaction to API server or web3;
    let resultSendTrans;
    let sendSuccess = false;
    for(let i = 0 ; i< sdkConfig.tryTimes;i++){
      try{
        resultSendTrans = await this.sendTrans(signedData);
        global.logger.debug("resultSendTrans :", resultSendTrans);
        sendSuccess     = true;
        ret.result      = resultSendTrans;
        break;
      }catch(error){
        global.logger.error("CrossChain::run sendTrans error:");
        global.logger.error("retry time:",i);
        global.logger.error(error);
        ret.result  = error;
      }
    }
    if(sendSuccess !== true){
      ret.code    = false;
      return ret;
    }
    try{
      global.logger.debug("result of sendTrans:", resultSendTrans);
      global.logger.debug("before postSendTrans");
      this.postSendTrans(resultSendTrans);
      global.logger.debug("after postSendTrans");
      // global.logger.debug("resultSendTrans :",resultSendTrans);
      ret.code    = true;
      ret.result  = resultSendTrans;
      // step5  : update transaction status in the database
    }catch(error){
      ret.code    = false;
      ret.result  = error;
      global.logger.error("postSendTrans error:",error);
    }
    return ret;
  }
}

module.exports = CrossChain;
