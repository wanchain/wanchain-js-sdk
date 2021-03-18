'use strict'

let TxDataCreator = require('../common/TxDataCreator');
let ccUtil        = require('../../../api/ccUtil');
let utils         = require('../../../util/util');

let logger = utils.getLogger('ApproveTxEthDataCreator.js');
/**
 * @class
 * @augments  TxDataCreator
 */
class ApproveTxEthDataCreator extends TxDataCreator{
    /**
     * @constructor
     * @param {Object} input  - {@link CrossChain#input input} of final users.(gas, gasPrice, value and so on)
     * @param {Object} config - {@link CrossChain#config config} of cross chain used.
     */
    constructor(input,config) {
        super(input,config);
    }

    /**
     * {@link TxDataCreator#createCommonData}
     * @override
     * @returns {Promise<{code: boolean, result: null}>}
     */
    async createCommonData(){
        logger.debug("Entering ApproveTxEthDataCreator::createCommonData");

        this.retResult.code = true;
        let  commonData     = {};
        let addr;
        if (this.input.from && (typeof this.input.from === 'object')) {
          let chain = global.chainManager.getChain(this.input.chainType);
          addr = await chain.getAddress(this.input.from.walletID, this.input.from.path);
          utils.addBIP44Param(this.input, this.input.from.walletID, this.input.from.path);
        } else {
          addr = {
            address: this.input.from.toLowerCase()
          }
        }

        commonData.from     = ccUtil.hexAdd0x(addr.address);
        commonData.to       = this.config.srcSCAddr;
        // if(this.input.chainType === 'WAN'){
        //     commonData.to   = this.config.buddySCAddr;
        // }
        commonData.value    = 0;
        commonData.gasPrice = ccUtil.getGWeiToWei(this.input.gasPrice);
        commonData.gasLimit = Number(this.input.gasLimit);
        commonData.gas      = Number(this.input.gasLimit);
        commonData.nonce    = null; // need todo
        this.retResult.result    = commonData;
        try{
            this.retResult.code    = true;

            commonData.nonce  = await ccUtil.getNonceByLocal(commonData.from,this.input.chainType);
            logger.info("ApproveTxEthDataCreator::createCommonData getNonceByLocal,%s",commonData.nonce);

            logger.debug("nonce:is ",commonData.nonce);
            if(this.input.hasOwnProperty('x')){
              commonData.x = this.input.x;
            }else{
              commonData.x = ccUtil.generatePrivateKey();
            }
            commonData.hashX = ccUtil.getSha256HashKey(commonData.x);
            //logger.debug("x:",commonData.x);
            logger.debug("hash x:",commonData.hashX);
            logger.debug("ApproveTxEthDataCreator::CommonData");
            //logger.debug(commonData);
            logger.debug(ccUtil.hiddenProperties(commonData,['x']));
            if(this.input.chainType === 'WAN'){
              commonData.Txtype = '0x01';
            }
            if (this.input.hasOwnProperty('chainId')) {
              commonData.chainId = this.input.chainId;
            } else {
              if (utils.isOnMainNet()) {
                commonData.chainId = '0x01';
              } else {
                commonData.chainId = (this.input.chainType === 'WAN') ? '0x03' : '0x04';
              }
            }
            this.retResult.result  = commonData;
        }catch(error){
            logger.error("error:",error);
            this.retResult.code      = false;
            this.retResult.result    = error;
        }
        return Promise.resolve(this.retResult);
    }

    /**
     * @override
     * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
     */
    createContractData(){
        logger.debug("Entering ApproveTxEthDataCreator::createContractData");
        try{
            let data = ccUtil.getDataByFuncInterface(this.config.srcAbi,
              this.config.srcSCAddr,
              this.config.approveScFunc,
              this.config.midSCAddr,
              ccUtil.tokenToWeiHex(this.input.amount,this.config.tokenDecimals));
            this.retResult.result    = data;
            this.retResult.code      = true;
        }catch(error){
            logger.error("createContractData: error: ",error);
            this.retResult.result      = error;
            this.retResult.code        = false;
        }
        return this.retResult;
    }
}

module.exports = ApproveTxEthDataCreator;
