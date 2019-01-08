'use strict'

let ccUtil                  = require('../../../api/ccUtil');
let BtcTransaction          = require('../../transaction/btc/BtcTransaction');
let BtcDataSign             = require('../../data-sign/btc/BtcDataSign');
let BtcDataSignWan          = require('../../data-sign/wan/WanDataSign');
let RevokeTxBtcDataCreator  = require('../../tx-data-creator/btc/RevokeTxBtcDataCreator');
let CrossChain              = require('../common/CrossChain');

class CrossChainBtcRevoke extends CrossChain{
    /**
     * @param: {Object} -
     *     input {
     *         hashX:
     *         keypair:     -- alice
     *         feeHard:
     *     }
     */
    constructor(input,config) {
        super(input,config);
        this.input.chainType = config.srcChainType;
        this.input.keystorePath = config.dstKeystorePath; // TODO: BTC doesn't have keystore, use WAN
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
            this.retResult.result = new RevokeTxBtcWanDataCreator(this.input, this.config);
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
            this.retResult.result = new BtcDataSign(this.input,this.config);
        } else if (this.input.chainType == 'WAN') {
            this.retResult.result = new BtcDataSignWan(this.input, this.config);
        } else {
            this.retResult.code = false;
            this.retResult.result = "ChainType error.";
        }
        return this.retResult;
    }

    //sendTrans(data){
    //    console.log("Sending CrossChainBtcRevoke, I'm just saying it!");
    //    return Promise.Resolve("OK!");
    //}

    postSendTrans(resultSendTrans){
        global.logger.debug("Entering CrossChainBtcRevoke::postSendTrans");
        let record = global.wanDb.getItem(this.config.crossCollection,{HashX: this.input.hashX});

        record.btcRevokeTxHash = ccUtil.hexTrip0x(resultSendTrans);
        record.status          = 'sentRevokePending';
        this.retResult.code = true;
        return this.retResult;
    }
}

module.exports = CrossChainBtcRevoke;
