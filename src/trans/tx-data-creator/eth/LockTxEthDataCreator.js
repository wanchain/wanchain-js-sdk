'use strict'
let TxDataCreator = require('../common/TxDataCreator');
let ccUtil = require('../../../api/ccUtil');
let error  = require('../../../api/error');
let utils  = require('../../../util/util');
// let btcUtil       =  require('../../../api/btcUtil');
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
        if (input.from === undefined || (input.isSend && (typeof input.from !== 'object' || !input.from.hasOwnProperty('walletID') || !input.from.hasOwnProperty('path')))) {
            this.retResult.code = false;
            this.retResult.result = new error.InvalidParameter("Invalid 'from' address!");
        } else if (input.to === undefined || (input.crossType !== 'FAST' && (typeof input.to !== 'object' || !input.to.hasOwnProperty('walletID') || !input.to.hasOwnProperty('path')))) {
            this.retResult.code = false;
            this.retResult.result = new error.InvalidParameter("Invalid 'to' address!");
        } else if (input.storeman === undefined) {
            this.retResult.code = false;
            this.retResult.result = new error.InvalidParameter('The storeman entered is invalid.');
        } else if (input.tokenPairID === undefined) {
            this.retResult.code = false;
            this.retResult.result = new error.InvalidParameter('The tokenPairID entered is invalid.');
        } else if (input.amount === undefined) {
            this.retResult.code = false;
            this.retResult.result = new error.InvalidParameter('The amount entered is invalid.');
        } else if (input.gasPrice === undefined) {
            this.retResult.code = false;
            this.retResult.result = new error.InvalidParameter('The gasPrice entered is invalid.');
        } else if (input.gasLimit === undefined) {
            this.retResult.code = false;
            this.retResult.result = new error.InvalidParameter('The gasLimit entered is invalid.');
        } else {
            let commonData = {};

            if(this.input.chainType === 'WAN'){
                commonData.Txtype = '0x01';
            }
            // let value;

            // if (input.chainType === 'WAN') {
            //     commonData.Txtype = "0x01";

            //     let coin2WanRatio = await ccUtil.getC2WRatio('ETH');
            //     let txFeeRatio = input.txFeeRatio;
            //     value = ccUtil.calculateLocWanFee(input.amount, coin2WanRatio, txFeeRatio);
            //     logger.info("amount:coin2WanRatio:txFeeRatio:Fee", input.amount, coin2WanRatio, txFeeRatio, value);

            // } else if (input.chainType == 'ETH') {
            //     value = ccUtil.tokenToWeiHex(input.amount,this.config.tokenDecimals);
            // } else {
            //     this.retResult.code = false;
            //     this.retResult.result = new error.RuntimeError("source chain is ERROR.");
            //     return this.retResult;
            // }


            let addr;
            if (this.input.from && (typeof this.input.from === 'object')) {
                let chain = global.chainManager.getChain(input.chainType);
                addr = await chain.getAddress(input.from.walletID, input.from.path);
                utils.addBIP44Param(input, input.from.walletID, input.from.path);
            } else {
                addr = {
                    address: this.input.from.toLowerCase()
                }
            }

            input.fromAddr = ccUtil.hexAdd0x(addr.address);

            commonData.from = ccUtil.hexAdd0x(addr.address);
            commonData.to = config.midSCAddr;
            if (this.config.tokenStand !== 'TOKEN' && this.config.tokenStand === this.input.chainType) {
                commonData.value = ccUtil.tokenToWeiHex(input.amount,this.config.tokenDecimals);
            } else {
                commonData.value = 0;
            }
            commonData.value = '0x' + utils.toBigNumber(commonData.value).add(utils.toBigNumber(input.networkFee)).trunc().toString(16);

            let feeRate = (input.feeRate) ? input.feeRate : 0;
            this.input.feeRate = feeRate;
            let networkFee = 0;
            if (['BTC'].includes(this.config.dstChainType)) {
                networkFee = await ccUtil.estimateNetworkFee('BTC', this.config.crossMode, {'feeRate': this.input.feeRate});
            }
            commonData.networkFee = networkFee;
            this.input.networkFee = networkFee;

            let crossValue;
            crossValue = '0x' + utils.toBigNumber(ccUtil.tokenToWeiHex(input.amount,this.config.tokenDecimals)).sub(utils.toBigNumber(networkFee)).trunc().toString(16);
            commonData.crossValue = crossValue;
            this.input.crossValue = crossValue;

            commonData.gasPrice = ccUtil.getGWeiToWei(input.gasPrice);
            commonData.gasLimit = Number(input.gasLimit);
            commonData.gas = Number(input.gasLimit);

            if (this.input.hasOwnProperty('chainId')) {
                commonData.chainId = this.input.chainId;
            } else {
                switch(this.input.chainType){
                    case 'BNB':
                    {
                      commonData.chainId = (utils.isOnMainNet()) ? '0x38' : '0x61';
                    }
                      break;
                    case 'ETH':
                    {
                      commonData.chainId = (utils.isOnMainNet()) ? '0x1' : '0x5';
                    }
                      break;
                    case 'WAN':
                    {
                      commonData.chainId = (utils.isOnMainNet()) ? '0x1' : '0x3';
                    }
                      break;
                    default:
                    {
                      logger.error("Error chainType! ", this.input.chainType);
                    }
                  }
            }
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
            let hashX = ccUtil.getSha256HashKey(x);

            this.input.x = x;
            this.input.hashX = hashX;

            let chain;
            let addr;

            logger.debug("Key:", x);
            logger.debug("hashKey:", hashX);
            let data;
            let crossAddr;

            chain = global.chainManager.getChain(this.config.dstChainType);
            if (input.to && (typeof input.to === 'object')) {
                addr = await chain.getAddress(input.to.walletID, input.to.path);
            } else {
                if (this.config.dstChainType !== 'BTC' && this.config.dstChainType !== 'XRP') {
                    addr = {
                        address: input.to.toLowerCase()
                    }
                } else {
                    addr = {
                        address: input.to
                    }
                }
            }

            if (['BTC', 'XRP'].includes(this.config.dstChainType)) {
                crossAddr = Buffer.from(addr.address, 'ascii').toString('hex');
                this.input.toAddr = addr.address;
                // let btcnetwork = utils.getConfigSetting("sdk:config:btcNetworkName", 'mainnet');
                // let crossH160 = '0x'+ btcUtil.addressToHash160(addr.address, 'pubkeyhash', btcnetwork);

                // this.input.h160CrossAddr = crossH160;
                // crossAddr = crossH160;
            } else {
                crossAddr = addr.address;
                this.input.toAddr = ccUtil.hexAdd0x(addr.address);
            }

            if (input.crossType === 'HTLC') {
                    data = ccUtil.getDataByFuncInterface(
                        this.config.midSCAbi,
                        this.config.midSCAddr,
                        this.config.lockScFunc,
                        hashX,
                        input.storeman,
                        input.tokenPairID,
                        ccUtil.tokenToWeiHex(input.amount,this.config.tokenDecimals),
                        ccUtil.hexAdd0x(crossAddr)
                      );
            } else if (input.crossType === 'FAST') {
                // data = ccUtil.getDataByFuncInterface(
                //     this.config.midSCAbi,
                //     this.config.midSCAddr,
                //     this.config.fastLockScFunc,
                //     input.storeman,
                //     input.tokenPairID,
                //     ccUtil.tokenToWeiHex(input.amount,this.config.tokenDecimals),
                //     ccUtil.hexAdd0x(addr.address)
                //   );
                if (this.config.crossMode === 'Lock') {
                    data = ccUtil.getDataByFuncInterface(
                        this.config.midSCAbi,
                        this.config.midSCAddr,
                        this.config.bridgeScFunc,
                        input.storeman,
                        input.tokenPairID,
                        ccUtil.tokenToWeiHex(input.amount,this.config.tokenDecimals),
                        ccUtil.hexAdd0x(crossAddr)
                      );
                } else {
                    let networkFee = (this.input.networkFee) ? this.input.networkFee : 0;
                    let hex_networkFee = parseInt(networkFee).toString(16);

                    data = ccUtil.getDataByFuncInterface(
                        this.config.midSCAbi,
                        this.config.midSCAddr,
                        this.config.bridgeScFunc,
                        input.storeman,
                        input.tokenPairID,
                        ccUtil.tokenToWeiHex(input.amount,this.config.tokenDecimals),
                        ccUtil.hexAdd0x(hex_networkFee),
                        ccUtil.hexAdd0x(this.config.srcSCAddr),
                        ccUtil.hexAdd0x(crossAddr)
                      );
                }

            } else { 
                this.retResult.code = false;
                this.retResult.result = new error.RuntimeError("crossType is ERROR.");
                return this.retResult;
            }
            
            // if (input.chainType === 'ETH') {
            //     chain = global.chainManager.getChain('WAN');
            //     addr = await chain.getAddress(input.to.walletID, input.to.path);

            //     if (input.mode === 'HTLC') {
            //         data = ccUtil.getDataByFuncInterface(
            //             this.config.midSCAbi,
            //             this.config.midSCAddr,
            //             // this.config.lockScFunc,
            //             'userMintLock',
            //             hashX,
            //             input.storeman,
            //             input.tokenPairID,
            //             input.value,
            //             ccUtil.hexAdd0x(addr.address)
            //           );
            //     } else if (input.mode === 'FAST') {
            //         data = ccUtil.getDataByFuncInterface(
            //             this.config.midSCAbi,
            //             this.config.midSCAddr,
            //             // this.config.lockScFunc,
            //             'userFastMint',
            //             hashX,
            //             input.storeman,
            //             input.tokenPairID,
            //             input.value,
            //             ccUtil.hexAdd0x(addr.address)
            //           );
            //     } else {
            //         data = ccUtil.getDataByFuncInterface(
            //             this.config.midSCAbi,
            //             this.config.midSCAddr,
            //             this.config.lockScFunc,
            //             hashX,
            //             input.storeman,
            //             ccUtil.hexAdd0x(addr.address)
            //           );
            //     }

            // } else if (input.chainType === 'WAN') {
            //     chain = global.chainManager.getChain('ETH');
            //     addr = await chain.getAddress(input.to.walletID, input.to.path);

            //     logger.debug(" wan contract ");
            //     if (input.mode === 'HTLC') {
            //         data = ccUtil.getDataByFuncInterface(
            //             this.config.midSCAbi,
            //             this.config.midSCAddr,
            //             this.config.lockScFunc,
            //             hashX,
            //             input.storeman,
            //             ccUtil.hexAdd0x(addr.address),
            //             ccUtil.tokenToWeiHex(input.amount,this.config.tokenDecimals)
            //           );
            //     } else if (input.mode === 'FAST') {
            //         data = ccUtil.getDataByFuncInterface(
            //             this.config.midSCAbi,
            //             this.config.midSCAddr,
            //             this.config.lockScFunc,
            //             hashX,
            //             input.storeman,
            //             ccUtil.hexAdd0x(addr.address),
            //             ccUtil.tokenToWeiHex(input.amount,this.config.tokenDecimals)
            //           );
            //     } else {
            //         data = ccUtil.getDataByFuncInterface(
            //             this.config.midSCAbi,
            //             this.config.midSCAddr,
            //             this.config.lockScFunc,
            //             hashX,
            //             input.storeman,
            //             ccUtil.hexAdd0x(addr.address),
            //             ccUtil.tokenToWeiHex(input.amount,this.config.tokenDecimals)
            //           );
            //     }

            // } else {
            //     this.retResult.code = false;
            //     this.retResult.result = new error.RuntimeError("source chain is ERROR.");
            //     return this.retResult;
            // }

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
