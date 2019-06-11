'use strict'

let TxDataCreator = require('../common/TxDataCreator');
let ccUtil = require('../../../api/ccUtil');
let utils  = require('../../../util/util');
let wanUtil= require('wanchain-util');

let logger = utils.getLogger('PrivateSendTxWanDataCreator.js');

/**
 * @class
 * @augments TxDataCreator
 */
class PrivateSendTxWanDataCreator extends TxDataCreator {
    /**
     * @constructor
     * @param {Object} input  - {@link CrossChain#input input} of final users.(gas, gasPrice, value and so on)
     * @param {Object} config - {@link CrossChain#config config} of cross chain used.
     */
    constructor(input, config) {
        super(input, config);
        this.toOta = null;
    }

    /**
     * @override
     * @returns {Promise<{code: boolean, result: null}>}
     */
    async createCommonData(){
        logger.debug("Entering PrivateSendTxWanDataCreator::createCommonData");

        this.retResult.code= true;
        let commonData     = {};

        commonData.Txtype = '0x01';

        // input.chainType must be WAN
        // let chain = global.chainManager.getChain(input.chainType);
        // let addr = await chain.getAddress(input.from.walletID, input.from.path);

        // TODO: use BIP44Path??
        commonData.from = this.input.from;

        // this.input.to should be private address
        //
        commonData.to = wanUtil.contractCoinAddress;
        commonData.value = ccUtil.tokenToWeiHex(this.input.amount, this.config.tokenDecimals);

        commonData.gasPrice = ccUtil.getGWeiToWei(this.input.gasPrice);
        commonData.gasLimit = Number(this.input.gasLimit);
        commonData.gas      = Number(this.input.gasLimit);
        commonData.nonce    = null; // need todo
        this.retResult.result    = commonData;
        try{
            this.retResult.code    = true;

            if(this.config.useLocalNode === true){
                commonData.nonce  = this.input.nonce || await ccUtil.getNonceByWeb3(commonData.from);
                logger.info("PrivateSendTxWanDataCreator::createCommonData getNonceByWeb3,%s",commonData.nonce);
            }else{
                commonData.nonce  = this.input.nonce || await ccUtil.getNonceByLocal(commonData.from, this.input.chainType);
                logger.info("PrivateSendTxWanDataCreator::createCommonData getNonceByLocal,%s",commonData.nonce);
            }
            logger.debug("nonce:is ",commonData.nonce);

            if (this.input.hasOwnProperty('chainId')) {
                commonData.chainId = this.input.chainId;
            } else {
                if (utils.isOnMainNet()) {
                    commonData.chainId = '0x01';
                } else {
                    commonData.chainId = '0x03';
                }
            }
            this.retResult.result  = commonData;
        }catch(error){
            logger.error("error:",error);
            this.retResult.code   = false;
            this.retResult.result = error;
        }
        return Promise.resolve(this.retResult);
    }

    /**
     * @override
     * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
     */
    createContractData(){
      try{
          logger.debug("Entering PrivateSendTxWanDataCreator::createContractData");
          let data = ccUtil.getDataByFuncInterface(wanUtil.coinSCAbi,
              wanUtil.contractCoinAddress,
              'buyCoinNote',
              wanUtil.generateOTAWaddress(this.input.to),
              ccUtil.tokenToWeiHex(this.input.amount, this.config.tokenDecimals));
          this.retResult.result = data;
          this.retResult.code   = true;
      } catch(error) {
          logger.error("PrivateSendTxWanDataCreator::createContractData: error: ",error);
          this.retResult.result = error;
          this.retResult.code   = false;
      }
      return this.retResult;
    }
}
module.exports = PrivateSendTxWanDataCreator;
