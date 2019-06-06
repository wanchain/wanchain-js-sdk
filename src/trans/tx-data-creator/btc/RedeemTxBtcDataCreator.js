'use strict'

const bitcoin   = require('bitcoinjs-lib');

let TxDataCreator = require('../common/TxDataCreator');
let ccUtil        = require('../../../api/ccUtil');
let error         = require('../../../api/error');
let hdUtil        = require('../../../api/hdUtil');
let utils         = require('../../../util/util');

let logger = utils.getLogger('RedeemTxBtcDataCreator.js');

class RedeemTxBtcDataCreator extends TxDataCreator{
    /**
     * @param: {object}
     *     input: {
     *         x
     *         hashX
     *         gasPrice
     *         gas
     *         password - optional, provided if it's rawkey/keystore wallet
     *     }
     */
    constructor(input,config) {
      super(input,config);
    }
    async createCommonData(){
        logger.debug("Entering RedeemTxBtcDataCreator::createCommonData");
        let input = this.input;
        let config = this.config;

        if (input.x === undefined) {
            this.retResult.code = false;
            this.retResult.result = new error.InvalidParameter("Input missing 'x'.");
        //} else if (input.hashX === undefined) {
        //    this.retResult.code = false;
        //    this.retResult.result = 'The hashX entered is invalid.';
        } else if (input.gasPrice === undefined) {
            this.retResult.code = false;
            this.retResult.result = new error.InvalidParameter("Input missing 'gasPrice'.");
        } else if (input.gas === undefined) {
            this.retResult.code = false;
            this.retResult.result = new error.InvalidParameter("Input missing 'gas'.");
        } else {
            let key = ccUtil.hexTrip0x(this.input.x);
            // NOTE: this hashX doesn't have prefix '0x'
            let hashX = bitcoin.crypto.sha256(Buffer.from(key, 'hex')).toString('hex');
            let record = global.wanDb.getItem(this.config.crossCollection,{hashX:hashX});

            if (record) {
                let commonData = {};
                let fromAddr = await hdUtil.getAddress(record.wanAddress.walletID, 'WAN', record.wanAddress.path);

                utils.addBIP44Param(input, record.wanAddress.walletID, record.wanAddress.path);

                commonData.Txtype = "0x01"; // WAN
                commonData.from  = '0x' + fromAddr.address;
                commonData.to    = config.dstSCAddr; // wanchainHtlcAddr
                commonData.value = 0;
                commonData.gasPrice = ccUtil.getGWeiToWei(input.gasPrice);
                commonData.gasLimit = Number(input.gas);
                commonData.gas = Number(input.gas);


                try {
                    commonData.nonce = await ccUtil.getNonceByLocal(commonData.from, 'WAN'); // TODO:
                    logger.info("RedeemTxEthDataCreator::createCommonData getNonceByLocal,%s",commonData.nonce);
                    logger.debug("nonce is ", commonData.nonce);

                    this.retResult.result = commonData;
                    this.retResult.code   = true;
                } catch (error) {
                    logger.error("error:", error);
                    this.retResult.code = false;
                    this.retResult.result = error;
                }
            } else {
                this.retResult.code = false;
                this.retResult.result = 'Record not found';
            }

        }
        logger.debug("RedeemTxBtcDataCreator::createCommonData is completed.");

        return this.retResult;
    }

    createContractData(){
        logger.debug("Entering RedeemTxBtcDataCreator::createContractData");
        let input = this.input;
        let config = this.config;
        try {
            logger.debug("Redeem BTC contract function: ", config.redeemScFunc);
            let data = ccUtil.getDataByFuncInterface(
                config.dstAbi,  // ABI of wan
                config.dstSCAddr, // WAN HTLC SC addr
                config.redeemScFunc, // btc2wbtcRedeem
                input.x
            );
            this.retResult.code   = true;
            this.retResult.result = data;
        } catch(error) {
            logger.error("Create contract data caught error:", error);
            this.retResult.code   = false;
            this.retResult.result = error;
        }
        logger.debug("RedeemTxBtcDataCreator::createContractData completed.");
        return this.retResult;
    }
}

module.exports = RedeemTxBtcDataCreator;
