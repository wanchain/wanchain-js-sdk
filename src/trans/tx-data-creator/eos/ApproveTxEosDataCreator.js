'use strict'

let TxDataCreator = require('../common/TxDataCreator');
let ccUtil        = require('../../../api/ccUtil');
let utils         = require('../../../util/util');

let logger = utils.getLogger('ApproveTxEosDataCreator.js');
/**
 * @class
 * @augments  TxDataCreator
 */
class ApproveTxEosDataCreator extends TxDataCreator{
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
        logger.debug("Entering ApproveTxEosDataCreator::createCommonData");

        this.retResult.code = true;
        let  commonData     = {};
        let chain = global.chainManager.getChain(this.input.chainType);
        let address;
        if (this.input.from && (typeof this.input.from === 'object')) {
            let addr = await chain.getAddress(this.input.from.walletID, this.input.from.path);
            utils.addBIP44Param(this.input, this.input.from.walletID, this.input.from.path);

            address = addr.address;
        } else {
            address = this.input.from;
        }
        if(this.input.chainType === 'WAN'){
            address = ccUtil.hexAdd0x(address);
        }

        this.input.fromAddr = address;
        commonData.from     = address;

        commonData.to       = this.config.srcSCAddr;
        if(this.input.chainType === 'WAN'){
            commonData.to   = this.config.buddySCAddr;
        }
        commonData.value    = 0;
        commonData.gasPrice = ccUtil.getGWeiToWei(this.input.gasPrice);
        commonData.gasLimit = Number(this.input.gasLimit);
        commonData.gas      = Number(this.input.gasLimit);
        commonData.nonce    = null; // need todo
        this.retResult.result    = commonData;
        try{
            this.retResult.code    = true;

            if(this.input.hasOwnProperty('testOrNot')){
              commonData.nonce  = ccUtil.getNonceTest();
            }else{
              commonData.nonce  = await ccUtil.getNonceByLocal(commonData.from,this.input.chainType);
              logger.info("ApproveTxEosDataCreator::createCommonData getNonceByLocal,%s",commonData.nonce);
            }
            logger.debug("nonce:is ",commonData.nonce);
            if(this.input.hasOwnProperty('x')){
              commonData.x = this.input.x;
            }else{
              commonData.x = ccUtil.generatePrivateKey();
            }
            commonData.hashX = ccUtil.getHashKey(commonData.x);
            //logger.debug("x:",commonData.x);
            logger.debug("hash x:",commonData.hashX);
            logger.debug("ApproveTxEosDataCreator::CommonData");
            //logger.debug(commonData);
            logger.debug(ccUtil.hiddenProperties(commonData,['x']));
            if(this.input.chainType === 'WAN'){
              commonData.Txtype = '0x01';
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
        logger.debug("Entering ApproveTxEosDataCreator::createContractData");
        try{
            let data = ccUtil.getDataByFuncInterface(this.config.srcAbi,
              this.config.srcSCAddr,
              this.config.approveScFunc,
              this.config.midSCAddr,
              ccUtil.tokenToWeiHex(this.input.amount,this.config.tokenDecimals));
            this.retResult.result    = data;
            this.retResult.code      = true;
        }catch(error){
            logger.error("ApproveTxEosDataCreator::createContractData: error: ",error);
            this.retResult.result      = error;
            this.retResult.code        = false;
        }
        return this.retResult;
    }
}

module.exports = ApproveTxEosDataCreator;
