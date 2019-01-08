'use strict'

const bitcoin = require('bitcoinjs-lib');
let BtcTransaction          = require('../../transaction/btc/BtcTransaction');
let DataSign                = require('../../data-sign/wan/WanDataSign');
let RedeemTxBtcDataCreator  = require('../../tx-data-creator/btc/RedeemTxBtcDataCreator');
let CrossChain              = require('../common/CrossChain');

let ccUtil        =  require('../../../api/ccUtil');

class CrossChainBtcRedeem extends CrossChain{
    constructor(input,config) {
        super(input,config);
        this.input.chainType    = config.srcChainType;
        this.input.keystorePath = config.dstKeyStorePath; // TODO: BTC doesn't have keystore, use dst temporaryly 

    }
    /**
     * Same with {@link CrossChain#checkPreCondition CrossChain#checkPreCondition}
     * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
     */
    checkPreCondition(){
        global.logger.debug("Entering CrossChainBtcRedeem::checkPreCondition");

        this.retResult.code = false;
        if (!this.input.hasOwnProperty('x')){ 
            global.logger.error("Input missing attribute 'x'");
            return this.retResult;
        }
        if (!this.input.hasOwnProperty('hashX')){ 
            global.logger.error("Input missing attribute 'hashX'");
            return this.retResult;
        }
        if (!this.input.hasOwnProperty('gasPrice')){ 
            global.logger.error("Input missing attribute 'gasPrice'");
            return this.retResult;
        }
        if (!this.input.hasOwnProperty('gas')){ 
            global.logger.error("Input missing attribute 'gas'");
            return this.retResult;
        }
        if (!this.input.hasOwnProperty('password')){ 
            global.logger.error("Input missing attribute 'password'");
            return this.retResult;
        }

        this.retResult.code = true;
        return this.retResult;
    }

    createDataCreator(){
        global.logger.debug("Entering CrossChainBtcRedeem::createDataCreator");
        this.retResult.code = true;
        this.retResult.result = new RedeemTxBtcDataCreator(this.input,this.config);
        return this.retResult;
    }
  
    createDataSign(){
        global.logger.debug("Entering CrossChainBtcRedeem::createDataSign");
        this.retResult.code = true;
        this.retResult.result = new DataSign(this.input,this.config);
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
  
        let key = ccUtil.hexTrip0x(this.input.x);
        let hashKey = bitcoin.crypto.sha256(Buffer.from(key, 'hex')).toString('hex');
        let record = global.wanDb.getItem(this.config.crossCollection, {HashX: hashKey});
  
        record.refundTxHash = ccUtil.hexTrip0x(resultSendTrans);
        record.status = 'sentXPending';
  
        global.logger.info("collection is :",this.config.crossCollection);
        global.logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
        global.wanDb.updateItem(this.config.crossCollection, {HashX:record.hashX},record);
  
        this.retResult.code = true;
        return this.retResult;
    }

    sendTrans(data){
        global.logger.debug("CrossChainBtcRedeem : This is only for debug");

        return Promise.resolve('OK');
    }      
}

module.exports = CrossChainBtcRedeem;
