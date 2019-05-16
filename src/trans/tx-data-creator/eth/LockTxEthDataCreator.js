'use strict'
let TxDataCreator = require('../common/TxDataCreator');
let ccUtil = require('../../../api/ccUtil');
let error  = require('../../../api/error');
let utils  = require('../../../util/util');

let logger = utils.getLogger('LockTxEthDataCreator.js');

/**
 * @class
 * @augments  TxDataCreator
 */
class LockTxEthDataCreator extends TxDataCreator {
    /**
     * @constructor
     * @param {Object} input  - {@link CrossChain#input input} of final users.(gas, gasPrice, value and so on)
     * @param {Object} config - {@link CrossChain#config config} of cross chain used.
     */
    constructor(input, config) {
      super(input, config);
    }

    /**
     * @override
     * @returns {Promise<{code: boolean, result: null}|transUtil.this.retResult|{code, result}>}
     */
    async createCommonData() {
        logger.debug("Entering LockTxEthDataCreator::createCommonData");

        let input = this.input;
        let config = this.config;

        //check input
        if (typeof input.from !== 'object' || !input.from.hasOwnProperty('walletID') || !input.from.hasOwnProperty('path')) {
            this.retResult.code = false;
            this.retResult.result = error.InvalidParameter("Invalid 'from' address!");
        } else if (typeof input.to !== 'object' || !input.to.hasOwnProperty('walletID') || !input.to.hasOwnProperty('path')) {
            this.retResult.code = false;
            this.retResult.result = error.InvalidParameter("Invalid 'to' address!");
        } else if (input.storeman === undefined) {
            this.retResult.code = false;
            this.retResult.result = error.InvalidParameter('The storeman entered is invalid.');
        } else if (input.amount === undefined) {
            this.retResult.code = false;
            this.retResult.result = error.InvalidParameter('The amount entered is invalid.');
        } else if (input.gasPrice === undefined) {
            this.retResult.code = false;
            this.retResult.result = error.InvalidParameter('The gasPrice entered is invalid.');
        } else if (input.gasLimit === undefined) {
            this.retResult.code = false;
            this.retResult.result = error.InvalidParameter('The gasLimit entered is invalid.');
        } else {
            let commonData = {};

            let value;
            if (input.chainType === 'WAN') {
                commonData.Txtype = "0x01";

                let coin2WanRatio = await ccUtil.getEthC2wRatio();
                let txFeeRatio = input.txFeeRatio;
                value = ccUtil.calculateLocWanFee(input.amount, coin2WanRatio, txFeeRatio);
                logger.info("amount:coin2WanRatio:txFeeRatio:Fee", input.amount, coin2WanRatio, txFeeRatio, value);

            } else if (input.chainType == 'ETH') {
                value = ccUtil.tokenToWeiHex(input.amount,this.config.tokenDecimals);
            } else {
                this.retResult.code = false;
                this.retResult.result = error.RuntimeError("source chain is ERROR.");
                return this.retResult;
            }

            let chain = global.chainManager.getChain(input.chainType);
            let addr = await chain.getAddress(input.from.walletID, input.from.path);

            utils.addBIP44Param(input, input.from.walletID, input.from.path);
            input.fromAddr = ccUtil.hexAdd0x(addr.address);

            commonData.from = ccUtil.hexAdd0x(addr.address);
            commonData.to = config.midSCAddr;
            commonData.value = value;
            commonData.gasPrice = ccUtil.getGWeiToWei(input.gasPrice);
            commonData.gasLimit = Number(input.gasLimit);
            commonData.gas = Number(input.gasLimit);


            try {
                commonData.nonce = input.nonce || await ccUtil.getNonceByLocal(commonData.from, input.chainType);
                logger.info("LockTxEthDataCreator::createCommonData getNonceByLocal,%s",commonData.nonce);
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
    async createContractData() {
        logger.debug("Entering LockTxEthDataCreator::createContractData");
        let input = this.input;

        try {
            let x;
            if (this.input.hasOwnProperty('x')){
                x = this.input.x;
            }else{
                x = ccUtil.generatePrivateKey();
            }
            let hashX = ccUtil.getHashKey(x);

            this.input.x = x;
            this.input.hashX = hashX;

            let chain;
            let addr;

            logger.debug("Key:", x);
            logger.debug("hashKey:", hashX);
            let data;
            if (input.chainType === 'ETH') {
                chain = global.chainManager.getChain('WAN');
                addr = await chain.getAddress(input.to.walletID, input.to.path);

                data = ccUtil.getDataByFuncInterface(
                  this.config.midSCAbi,
                  this.config.midSCAddr,
                  this.config.lockScFunc,
                  hashX,
                  input.storeman,
                  ccUtil.hexAdd0x(addr.address)
                );
            } else if (input.chainType === 'WAN') {
                chain = global.chainManager.getChain('ETH');
                addr = await chain.getAddress(input.to.walletID, input.to.path);

                logger.debug(" wan contract ");
                data = ccUtil.getDataByFuncInterface(
                  this.config.midSCAbi,
                  this.config.midSCAddr,
                  this.config.lockScFunc,
                  hashX,
                  input.storeman,
                  ccUtil.hexAdd0x(addr.address),
                  ccUtil.tokenToWeiHex(input.amount,this.config.tokenDecimals)
                );
            } else {
                this.retResult.code = false;
                this.retResult.result = error.RuntimeError("source chain is ERROR.");
                return this.retResult;
            }

            this.input.toAddr = ccUtil.hexAdd0x(addr.address);

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

module.exports = LockTxEthDataCreator;
