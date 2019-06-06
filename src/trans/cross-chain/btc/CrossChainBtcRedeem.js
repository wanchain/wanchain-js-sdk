'use strict'

const bitcoin = require('bitcoinjs-lib');
let BtcTransaction          = require('../../transaction/common/Transaction');
let WbtcTransaction         = require('../../transaction/btc/BtcTransaction');
let WanDataSign             = require('../../data-sign/wan/WanDataSign');
let BtcDataSign             = require('../../data-sign/btc/BtcDataSign');
let RedeemTxBtcDataCreator  = require('../../tx-data-creator/btc/RedeemTxBtcDataCreator');
let RedeemTxWbtcDataCreator = require('../../tx-data-creator/btc/RedeemTxWbtcDataCreator');
let CrossChain              = require('../common/CrossChain');

let ccUtil = require('../../../api/ccUtil');
let utils  = require('../../../util/util');

let logger = utils.getLogger('CrossChainBtcRedeem.js');

class CrossChainBtcRedeem extends CrossChain{
    /**
     * @param: {Object} -
     *   BTC:
     *     input: {
     *         x
     *         hashX
     *         gasPrice
     *         gas
     *         password - optional, provided if it's rawkey/keystore wallet
     *     }
     *   WBTC:
     *     input {
     *         hashX:    -- No '0x' prefix !!!
     *         keypair:  -- alice
     *         feeHard:
     *     }
     */
    constructor(input,config) {
        super(input,config);
        this.input.chainType    = config.srcChainType;
        if (this.input.chainType == 'BTC') {
            //  TODO: BTC doesn't have keystore, use dst (WAN) temporaryly
            this.input.keystorePath = config.dstKeyStorePath;
        } else {
            // WBTC -> BTC
            this.input.keystorePath = config.srcKeyStorePath;
        }

    }

    createTrans(){
        logger.debug("Entering CrossChainBtcRedeem::createTrans");
        this.retResult.code = true;
        if (this.input.chainType == 'BTC') {
            this.retResult.result = new BtcTransaction(this.input, this.config);
        } else if (this.input.chainType == 'WAN') {
            this.retResult.result = new WbtcTransaction(this.input, this.config);
        } else {
            logger.error("CreateTrans invalid chainType '%s'.",
                           this.input.chainType);
            this.retResult.code = false;
            this.retResult.result = "Input chainType invalid.";
        }
        logger.debug("CrossChainBtcRedeem::createTrans completed.");
        return this.retResult;
    }

    createDataCreator(){
        logger.debug("Entering CrossChainBtcRedeem::createDataCreator");
        this.retResult.code = true;
        if (this.input.chainType == 'BTC') {
            this.retResult.result = new RedeemTxBtcDataCreator(this.input,this.config);
        } else if (this.input.chainType == 'WAN') {
            this.retResult.result = new RedeemTxWbtcDataCreator(this.input,this.config);
        } else {
            logger.error("CreateDataCreator invalid chainType '%s'.",
                            this.input.chainType);
            this.retResult.code = false;
            this.retResult.result = "Input chain type is invalid";
        }
        logger.debug("CrossChainBtcRedeem::createDataCreator completed.");
        return this.retResult;
    }

    createDataSign(){
        logger.debug("Entering CrossChainBtcRedeem::createDataSign");
        this.retResult.code = true;
        if (this.input.chainType == 'BTC') {
            this.retResult.result = new WanDataSign(this.input,this.config);
        } else if (this.input.chainType == 'WAN') {
            this.retResult.result = new BtcDataSign(this.input, this.config);
        } else {
            logger.error("CreateDataSign invalid chainType '%s'.",
                           this.input.chainType);
            this.retResult.code = false;
            this.retResult.result = "Input chain type invalid";
        }
        logger.debug("CrossChainBtcRedeem::createDataSign completed.");
        return this.retResult;
    }

   /**
     * @override
     * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
     */
    preSendTrans(signedData){
        //let record = global.wanDb.getItem(this.config.crossCollection,{x:this.input.x});

        //record.status         = CrossStatus.RedeemSending;
        logger.info("Entering CrossChainBtcRedeem::preSendTrans");
        //logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
        //global.wanDb.updateItem(this.config.crossCollection,{x:record.x},record);
        logger.info("CrossChainBtcRedeem::preSendTrans completed.");
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
        logger.info("Entering CrossChainBtcRedeem::transFailed");
        //logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
        //global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
        this.retResult.code = true;
        logger.info("CrossChainBtcRedeem::transFailed is completed.");
        return this.retResult;
    }

    /**
     * @override
     * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
     */
    postSendTrans(resultSendTrans){
        logger.debug("Entering CrossChainBtcRedeem::postSendTrans");

        let record;
        if (this.input.chainType == 'BTC') {
            let key = ccUtil.hexTrip0x(this.input.x);
            let hashKey = bitcoin.crypto.sha256(Buffer.from(key, 'hex')).toString('hex');
            record = global.wanDb.getItem(this.config.crossCollection, {hashX: hashKey});

            record.refundTxHash = ccUtil.hexTrip0x(resultSendTrans);
        } else if (this.input.chainType == 'WAN') {
            record = global.wanDb.getItem(this.config.crossCollection, {hashX: this.input.hashX});

            record.btcRefundTxHash = ccUtil.hexTrip0x(resultSendTrans);
        } else {
            logger.error("Post send tx, invalud input chain type:", this.input.chainType);
            this.retResult.code = false;
            return this.retResult;
        }
        record.status = 'sentXPending';

        logger.debug("record is :",ccUtil.hiddenProperties(record,['x']));
        global.wanDb.updateItem(this.config.crossCollection, {hashX:record.hashX}, record);

        this.retResult.code = true;

        logger.debug("CrossChainBtcRedeem::postSendTrans is completed.");
        return this.retResult;
    }

    sendTrans(data){
      let chainType = 'BTC';
      if (this.input.chainType == 'BTC') {
          // NOTICE: when BTC->WBTC, needs to send redeem tx to WAN network
          //         otherwise, sends tx to Bitcoin network
          chainType = 'WAN';
      }

      logger.debug("Redeem sendTrans chainType is :",chainType);
      logger.debug("sendTrans useLocalNode is :",this.config.useLocalNode);

      if( (chainType === 'WAN') && ( this.config.useLocalNode === true)){
        return ccUtil.sendTransByWeb3(data);
      }
      return ccUtil.sendTrans(data,chainType);
    }
}

module.exports = CrossChainBtcRedeem;
