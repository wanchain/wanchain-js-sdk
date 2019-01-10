'use strict'

const bitcoin = require('bitcoinjs-lib');
let WbtcTransaction         = require('../../transaction/btc/BtcTransaction');
let WanDataSign             = require('../../data-sign/wan/WanDataSign');
let BtcDataSign             = require('../../data-sign/btc/BtcDataSign');
let RedeemTxBtcDataCreator  = require('../../tx-data-creator/btc/RedeemTxBtcDataCreator');
let RedeemTxWbtcDataCreator = require('../../tx-data-creator/btc/RedeemTxWbtcDataCreator');
let CrossChain              = require('../common/CrossChain');

let ccUtil        =  require('../../../api/ccUtil');

class CrossChainBtcRedeem extends CrossChain{
    constructor(input,config) {
        super(input,config);
        this.input.chainType    = config.srcChainType;
        if (this.input.chainType == 'BTC') {
            this.input.keystorePath = config.dstKeyStorePath; // TODO: BTC doesn't have keystore, use dst temporaryly 
        } else { 
            this.input.keystorePath = config.srcKeyStorePath; // WBTC -> BTC
        } 

    }

    createTrans(){
        this.retResult.code = true;
        if (this.input.chainType == 'BTC') {
            this.retResult.result = new Transaction(this.input, this.config);
        } else if (this.input.chainType == 'WAN') {
            this.retResult.result = new WbtcTransaction(this.input, this.config);
        } else {
            this.retResult.code = false;
            this.retResult.result = "ChainType error.";
        }
        return this.retResult;
    }

    createDataCreator(){
        global.logger.debug("Entering CrossChainBtcRedeem::createDataCreator");
        this.retResult.code = true;
        if (this.input.chainType == 'BTC') {
            this.retResult.result = new RedeemTxBtcDataCreator(this.input,this.config);
        } else if (this.input.chainType == 'WAN') {
            this.retResult.result = new RedeemTxWbtcDataCreator(this.input,this.config);
        } else {
            this.retResult.code = false;
            this.retResult.result = "Invalid input chain type";
        }
        return this.retResult;
    }
  
    createDataSign(){
        global.logger.debug("Entering CrossChainBtcRedeem::createDataSign");
        this.retResult.code = true;
        if (this.input.chainType == 'BTC') {
            this.retResult.result = new WanDataSign(this.input,this.config);
        } else if (this.input.chainType == 'WAN') {
            this.retResult.result = new BtcDataSign(this.input, this.config);
        } else {
            this.retResult.code = false;
            this.retResult.result = "Invalid input chain type";
        }
        return this.retResult;
    }
  
   /**
     * @override
     * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
     */
    preSendTrans(signedData){
        //let record = global.wanDb.getItem(this.config.crossCollection,{x:this.input.x});
  
        //record.status         = CrossStatus.RedeemSending;
        global.logger.info("CrossChainBtcRedeem::preSendTrans");
        global.logger.info("collection is :",this.config.crossCollection);
        //global.logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
        //global.wanDb.updateItem(this.config.crossCollection,{x:record.x},record);
        this.retResult.code = true;
        return this.retResult;
    }
  
    /**
     * @override
     */
    transFailed(){
        //let hashX  = this.input.hashX;
        //let record = global.wanDb.getItem(this.config.crossCollection,{hashX:hashX});
        //record.status = CrossStatus.RedeemFail;
        global.logger.info("CrossChainBtcRedeem::transFailed");
        global.logger.info("collection is :",this.config.crossCollection);
        //global.logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
        //global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
        this.retResult.code = true;
        return this.retResult;
    }
  
    /**
     * @override
     * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
     */
    postSendTrans(resultSendTrans){
        global.logger.debug("Entering CrossChainBtcRedeem::postSendTrans");

        let record; 
        if (this.input.chainType == 'BTC') { 
            let key = ccUtil.hexTrip0x(this.input.x);
            let hashKey = bitcoin.crypto.sha256(Buffer.from(key, 'hex')).toString('hex');
            record = global.wanDb.getItem(this.config.crossCollection, {HashX: hashKey});
  
            record.refundTxHash = ccUtil.hexTrip0x(resultSendTrans);
        } else if (this.input.chainType == 'WAN') {
            record = global.wanDb.getItem(this.config.crossCollection, {HashX: this.input.hashX});

            record.btcRefundTxHash = ccUtil.hexTrip0x(resultSendTrans);
        } else {
            this.retResult.code = false;
            return this.retResult;
        }
        record.status = 'sentXPending';

        global.logger.info("collection is :",this.config.crossCollection);
        global.logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
        global.wanDb.updateItem(this.config.crossCollection, {HashX:record.hashX},record);
  
        this.retResult.code = true;
        return this.retResult;
    }

    //sendTrans(data){
    //    global.logger.debug("CrossChainBtcRedeem : This is only for debug");
    //    return Promise.resolve('OK');
    //}      
}

module.exports = CrossChainBtcRedeem;
