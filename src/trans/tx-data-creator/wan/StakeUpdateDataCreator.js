'use strict'

let TxDataCreator = require('../common/TxDataCreator');
let ccUtil = require('../../../api/ccUtil');
let error = require('../../../api/error');
let utils  = require('../../../util/util');
let wanUtil= require('wanchain-util');

let logger = utils.getLogger('StakeUpdateDataCreator.js');

/**
 * @class
 * @augments TxDataCreator
 */
class StakeUpdateDataCreator extends TxDataCreator {
    /**
     * @constructor
     * @param {Object} input  - {@link CrossChain#input input} of final users.(gas, gasPrice, value and so on)
     * @param {Object} config - {@link CrossChain#config config} of cross chain used.
     */
    constructor(input, config) {
        super(input, config);
        this.contract = utils.getConfigSetting('sdk:config:contract:csc', undefined);
        if (typeof this.contract !== 'object') {
            logger.error("Sorry, we don't have CSC contract definition!");
            throw new error.LogicError("No CSC contract definition!");
        }
    }

    /**
     * @override
     * @returns {Promise<{code: boolean, result: null}>}
     */
    async createCommonData(){
        logger.debug("Entering StakeUpdateDataCreator::createCommonData");

        this.retResult.code= true;
        let commonData     = {};

        commonData.Txtype = '0x01';

        // input.chainType must be WAN
        // let chain = global.chainManager.getChain(input.chainType);
        // let addr = await chain.getAddress(input.from.walletID, input.from.path);

        // TODO: use BIP44Path??
        commonData.from = this.input.from;
        commonData.to = this.contract.address;
        commonData.value = '0x0';

        commonData.gasPrice = ccUtil.getGWeiToWei(this.input.gasPrice);
        commonData.gasLimit = Number(this.input.gasLimit);
        commonData.gas      = Number(this.input.gasLimit);
        commonData.nonce    = null; // need todo
        this.retResult.result    = commonData;
        try{
            this.retResult.code    = true;

            if(this.config.useLocalNode === true){
                commonData.nonce  = await ccUtil.getNonceByWeb3(commonData.from);
                logger.info("StakeUpdateDataCreator::createCommonData getNonceByWeb3,%s",commonData.nonce);
            }else{
                commonData.nonce  = await ccUtil.getNonceByLocal(commonData.from, this.input.chainType);
                logger.info("StakeUpdateDataCreator::createCommonData getNonceByLocal,%s",commonData.nonce);
            }
            logger.debug("nonce:is ", commonData.nonce);

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
            logger.debug("Entering StakeUpdateDataCreator::createContractData");

            let data = ccUtil.getDataByFuncInterface(this.contract.ABI,
                this.contract.address,
                'stakeUpdate',
                this.input.minerAddr,
                this.input.lockTime);

            this.retResult.result = data;
            this.retResult.code   = true;
        } catch(error) {
            logger.error("StakeUpdateDataCreator::createContractData: error: ",error);
            this.retResult.result = error;
            this.retResult.code   = false;
        }
        return this.retResult;
    }
}

module.exports = StakeUpdateDataCreator;
