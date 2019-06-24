'use strict'

let utils                   = require('../../../util/util');
let ccUtil                  = require('../../../api/ccUtil');
let BtcTransaction          = require('../../transaction/btc/BtcTransaction');
let Transaction             = require('../../transaction/common/Transaction');
let BtcDataSign             = require('../../data-sign/btc/BtcDataSign');
let WanDataSign             = require('../../data-sign/wan/WanDataSign');
let RevokeTxBtcDataCreator  = require('../../tx-data-creator/btc/RevokeTxBtcDataCreator');
let RevokeTxWbtcDataCreator = require('../../tx-data-creator/btc/RevokeTxWbtcDataCreator');
let CrossChain              = require('../common/CrossChain');

let logger = utils.getLogger('CrossChainBtcRevoke.js');

class CrossChainBtcRevoke extends CrossChain{
    /**
     * @param: {Object} -
     *   For BTC:
     *     input {
     *         hashX:  - DO NOT start with '0x'
     *         from:   - Object, {walletID: , path: }
     *         feeHard:
     *     }
     *   For WBTC:
     *     input {
     *         hashX:    -- DO NOT start with '0x'
     *         gas:
     *         gasPrice:
     *         password:
     *         nonce:    -- optional
     *     }
     */
    constructor(input,config) {
        super(input,config);
        this.input.chainType = config.srcChainType;
        if (config.srcChainType == 'BTC') {
            // TODO:
            // Keystore is used for WAN account, but BTC doesn't have it, so use destination temporaryly
            this.input.keystorePath = config.dstKeystorePath;
        } else {
            this.input.keystorePath = config.srcKeystorePath;
        }
    }
    createTrans(){
        logger.debug("Entering CrossChainBtcRevoke::createTrans");
        this.retResult.code = true;

        if (this.input.chainType == 'BTC') {
            this.retResult.result = new BtcTransaction(this.input, this.config);
        } else if (this.input.chainType == 'WAN') {
            this.retResult.result = new Transaction(this.input, this.config);
        } else {
            this.retResult.code = false;
            this.retResult.result = "ChainType error.";
        }
        logger.debug("CrossChainBtcRevoke::createTrans is completed.");
        return this.retResult;
    }

    createDataCreator(){
        logger.debug("Entering CrossChainBtcRevoke::createDataCreator");
        this.retResult.code = true;
        if (this.input.chainType == 'BTC') {
            this.retResult.result = new RevokeTxBtcDataCreator(this.input,this.config);
        } else if (this.input.chainType == 'WAN') {
            this.retResult.result = new RevokeTxWbtcDataCreator(this.input, this.config);
        } else {
            this.retResult.code = false;
            this.retResult.result = "ChainType error.";
        }
        logger.debug("CrossChainBtcRevoke::createDataCreator is completed.");
        return this.retResult;
    }

    createDataSign(){
        logger.debug("Entering CrossChainBtcRevoke::createDataSign");
        this.retResult.code = true;
        if (this.input.chainType == 'BTC') {
            this.retResult.result = new BtcDataSign(this.input, this.config);
        } else if (this.input.chainType == 'WAN') {
            this.retResult.result = new WanDataSign(this.input, this.config);
        } else {
            this.retResult.code = false;
            this.retResult.result = "ChainType error.";
        }
        logger.debug("CrossChainBtcRevoke::createDataSign is completed.");
        return this.retResult;
    }

    //sendTrans(data){
    //    console.log("Sending CrossChainBtcRevoke, I'm just saying it!");
    //    return Promise.resolve("OK!");
    //}

    postSendTrans(resultSendTrans){
        logger.debug("Entering CrossChainBtcRevoke::postSendTrans");
        // WARNING: make sure hashX strip '0x' from hashX
        let record = global.wanDb.getItem(this.config.crossCollection,{hashX: this.input.hashX});

        if (record) {
            if (this.input.chainType == 'BTC') {
                record.btcRevokeTxHash = ccUtil.hexTrip0x(resultSendTrans);
            } else {
                record.revokeTxHash = ccUtil.hexTrip0x(resultSendTrans);
            }
            record.status          = 'sentRevokePending';
            global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);

            this.retResult.code = true;
        } else {
            logger.error("Transaction not found for hashX:", this.input.hashX);
        }
        logger.debug("CrossChainBtcRevoke::postSendTrans is completed.");
        return this.retResult;
    }
}

module.exports = CrossChainBtcRevoke;
