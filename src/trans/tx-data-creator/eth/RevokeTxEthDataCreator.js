'use strict'
let TxDataCreator = require('../common/TxDataCreator');
let ccUtil        = require('../../../api/ccUtil');
let error         = require('../../../api/error');
let utils         = require('../../../util/util');

let logger = utils.getLogger('RevokeTxEthDataCreator.js');

/**
 * @class
 * @augments  TxDataCreator
 */
class RevokeTxEthDataCreator extends TxDataCreator{
    /**
     * @constructor
     * @param {Object} input  - {@link CrossChain#input input} of final users.(gas, gasPrice, value and so on)
     * @param {Object} config - {@link CrossChain#config config} of cross chain used.
     */
    constructor(input,config) {
      super(input,config);
    }

    /**
     * @override
     * @returns {Promise<{code: boolean, result: null}|transUtil.this.retResult|{code, result}>}
     */
    async createCommonData(){
        logger.debug("Entering RevokeTxEthDataCreator::createCommonData");

        let input = this.input;
        let config = this.config;

        if (input.hashX === undefined) {
            this.retResult.code = false;
            this.retResult.result = new error.InvalidParameter('The hashX entered is invalid.');
        } else if (input.gasPrice === undefined) {
            this.retResult.code = false;
            this.retResult.result = new error.InvalidParameter('The gasPrice entered is invalid.');
        } else if (input.gasLimit === undefined) {
            this.retResult.code = false;
            this.retResult.result = new error.InvalidParameter('The gasLimit entered is invalid.');
        } else {
            let record = global.wanDb.getItem(this.config.crossCollection,{hashX:this.input.hashX});
            let commonData = {};
            if (input.chainType == 'WAN') {
                commonData.Txtype = "0x01";
            }

            let chain = global.chainManager.getChain(input.chainType);
            let addr = await chain.getAddress(record.from.walletID, record.from.path);

            utils.addBIP44Param(input, record.from.walletID, record.from.path);

            commonData.from = ccUtil.hexAdd0x(addr.address);
            commonData.to = config.srcSCAddr;
            commonData.value = 0;
            commonData.gasPrice = ccUtil.getGWeiToWei(input.gasPrice);
            commonData.gasLimit = Number(input.gasLimit);
            commonData.gas = Number(input.gasLimit);

            try {
                commonData.nonce = input.nonce || await ccUtil.getNonceByLocal(commonData.from, input.chainType);
                logger.info("RevokeTxEthDataCreator::createCommonData getNonceByLocal,%s",commonData.nonce);
                logger.debug("nonce:is ", commonData.nonce);

                this.retResult.result = commonData;
                this.retResult.code = true;

            } catch (error) {
                logger.error("error:", error);
                this.retResult.code = false;
                this.retResult.result = error;
            }

        }

        return this.retResult;
    }

    /**
     * @override
     * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
     */
    createContractData(){
        logger.debug("Entering RevokeTxEthDataCreator::createContractData");
        let input = this.input;

        try {
            let hashX = input.hashX;

            let data = ccUtil.getDataByFuncInterface(
              this.config.dstAbi,
              this.config.dstSCAddr,
              this.config.revokeScFunc,
              hashX
            );
            this.retResult.code = true;
            this.retResult.result = data;
        } catch (error) {
            logger.error("createContractData: error: ", error);
            this.retResult.result = error;
            this.retResult.code = false;
        }
        return this.retResult;
    }
}

module.exports = RevokeTxEthDataCreator;
