'use strict'

let ccUtil                  = require('../../../api/ccUtil');
let BtcTransaction          = require('../../transaction/btc/BtcTransaction');
let Transaction             = require('../../transaction/common/Transaction');
let BtcDataSign             = require('../../data-sign/btc/BtcDataSign');
let WanDataSign             = require('../../data-sign/wan/WanDataSign');
let RevokeTxBtcDataCreator  = require('../../tx-data-creator/btc/RevokeTxBtcDataCreator');
let RevokeTxWbtcDataCreator = require('../../tx-data-creator/btc/RevokeTxWbtcDataCreator');
let CrossChain              = require('../common/CrossChain');

class CrossChainBtcRevoke extends CrossChain{
    /**
     * @param: {Object} -
     *     For BTC:
     *     input {
     *         hashX:
     *         keypair:     -- alice
     *         feeHard:
     *     }
     *     For WBTC:
     *     input {
     *         hashX:
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
        this.retResult.code = true;

        if (this.input.chainType == 'BTC') {
            this.retResult.result = new BtcTransaction(this.input, this.config);
        } else if (this.input.chainType == 'WAN') {
            this.retResult.result = new Transaction(this.input, this.config);
        } else {
            this.retResult.code = false;
            this.retResult.result = "ChainType error.";
        }
        return this.retResult;
    }

    createDataCreator(){
        global.logger.debug("Entering CrossChainBtcRevoke::createDataCreator");
        this.retResult.code = true;
        if (this.input.chainType == 'BTC') {
            this.retResult.result = new RevokeTxBtcDataCreator(this.input,this.config);
        } else if (this.input.chainType == 'WAN') {
            this.retResult.result = new RevokeTxWbtcDataCreator(this.input, this.config);
        } else {
            this.retResult.code = false;
            this.retResult.result = "ChainType error.";
        }
        return this.retResult;
    }

    createDataSign(){
        global.logger.debug("Entering CrossChainBtcRevoke::createDataSign");
        this.retResult.code = true;
        if (this.input.chainType == 'BTC') {
            this.retResult.result = new BtcDataSign(this.input, this.config);
        } else if (this.input.chainType == 'WAN') {
            this.retResult.result = new WanDataSign(this.input, this.config);
        } else {
            this.retResult.code = false;
            this.retResult.result = "ChainType error.";
        }
        return this.retResult;
    }

    //sendTrans(data){
    //    console.log("Sending CrossChainBtcRevoke, I'm just saying it!");
    //    return Promise.resolve("OK!");
    //}

    postSendTrans(resultSendTrans){
        global.logger.debug("Entering CrossChainBtcRevoke::postSendTrans");
        // TODO: make sure hashX strip '0x' from hashX
        let record = global.wanDb.getItem(this.config.crossCollection,{HashX: this.input.hashX});

        if (record) {
            if (this.input.chainType == 'BTC') {
                record.btcRevokeTxHash = ccUtil.hexTrip0x(resultSendTrans);
            } else {
                record.revokeTxHash = ccUtil.hexTrip0x(resultSendTrans);
            }
            record.status          = 'sentRevokePending';
            global.wanDb.updateItem(this.config.crossCollection,{HashX:record.HashX},record);

            this.retResult.code = true;
        } else {
            global.logger.error("Transaction not found for hashX:", this.input.hashX);
        }
        return this.retResult;
    }
}

module.exports = CrossChainBtcRevoke;
