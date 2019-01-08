'use strict'

const bitcoin = require('bitcoinjs-lib');

let ccUtil                  = require('../../../api/ccUtil');
let btcUtil                 = require('../../../api/btcUtil');
let Transaction             = require('../../transaction/common/Transaction');
let BtcTransaction          = require('../../transaction/btc/BtcTransaction');
let BtcDataSign             = require('../../data-sign/btc/BtcDataSign');
let BtcDataSignWan          = require('../../data-sign/wan/WanDataSign');
let LockTxBtcDataCreator    = require('../../tx-data-creator/btc/LockTxBtcDataCreator');
let LockTxBtcWanDataCreator = require('../../tx-data-creator/btc/LockTxBtcWanDataCreator');
let CrossChain              = require('../common/CrossChain');
let CrossChainBtcLockNotice = require('./CrossChainBtcLockNotice');


class CrossChainBtcLock extends CrossChain {
    /**
     * @param: {Object} - input
     *    {
     *        smgBtcAddr    -- smgBtcAddr address
     *        keypair     -- key pairs (no need password as we have the key)
     *        utxos       -- inputs to build vin
     *        value       -- amount to send in sto
     *        feeRate     --
     *        changeAddress  -- address to send if there's any change
     *        password    --  NOTICE: password of WAN !!!
     *        storeman    -- 
     *        wanAddress  -- from 
     *        gas         --  
     *        gasPrice    --  
     *    }
     */
    constructor(input,config) {
        super(input,config);
        this.input.chainType = config.srcChainType;
        this.input.keystorePath = config.srcKeystorePath;
    }

    /**
     * Same with {@link CrossChain#checkPreCondition CrossChain#checkPreCondition}
     * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
     */
    checkPreCondition(){
        global.logger.debug("Entering CrossChainBtcLock::checkPreCondition");
        // Asssume failed firstly
        this.retResult.code = false;
        if (!this.input.hasOwnProperty('smgBtcAddr')){ 
            global.logger.error("Input missing attribute 'smgBtcAddr'");
            return this.retResult;
        }
        if (!this.input.hasOwnProperty('value')){ 
            global.logger.error("Input missing attribute 'value'");
            return this.retResult;
        }
        if (!this.input.hasOwnProperty('utxos')){ 
            global.logger.error("Input missing attribute 'utxos'");
            return this.retResult;
        }
        if (!this.input.hasOwnProperty('keypair')){ 
            global.logger.error("Input missing attribute 'keypair'");
            return this.retResult;
        }
        if (!this.input.hasOwnProperty('changeAddress')){ 
            global.logger.error("Input missing attribute 'changeAddress'");
            return this.retResult;
        }
        if (!this.input.hasOwnProperty('storeman')){ 
            global.logger.error("Input missing attribute 'storeman'");
            return this.retResult;
        }
        if (!this.input.hasOwnProperty('wanAddress')){ 
            global.logger.error("Input missing attribute 'wanAddress'");
            return this.retResult;
        }
        if (!this.input.hasOwnProperty('gas')){ 
            global.logger.error("Input missing attribute 'gas'");
            return this.retResult;
        }
        if (!this.input.hasOwnProperty('gasPrice')){ 
            global.logger.error("Input missing attribute 'gasPrice'");
            return this.retResult;
        }
        if (!this.input.hasOwnProperty('feeRate')){ 
            global.logger.error("Input missing attribute 'feeRate'");
            return this.retResult;
        }

        // WARNING: this is password for WAN !!!
        if (!this.input.hasOwnProperty('password')){ 
            global.logger.error("Input missing attribute 'password'");
            return this.retResult;
        }

        if (!Array.isArray(this.input.keypair) || this.input.keypair.length < 1) {
            global.logger.error("Input attribute 'keypair' invalid");
            return this.retResult;
        }

        /* Check if input utxo is enough*/
        let balance = ccUtil.getUTXOSBalance(this.input.utxos);
        if (balance <= this.input.value) {
            global.logger.error("UTXO balance is not enough");
            return this.retResult;
        }

        this.retResult.code = true;
        return this.retResult;
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
        global.logger.debug("Entering CrossChainBtcLock::createDataCreator");
        this.retResult.code = true;
        if (this.input.chainType == 'BTC') {
            this.retResult.result = new LockTxBtcDataCreator(this.input,this.config);
        } else if (this.input.chainType == 'WAN') {
            this.retResult.result = new LockTxBtcWanDataCreator(this.input, this.config);
        } else {
            this.retResult.code = false;
            this.retResult.result = "ChainType error.";
        }
        return this.retResult;
    }

    createDataSign(){
        global.logger.debug("Entering CrossChainBtcLock::createDataSign");
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

    /**
     * @override
     * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
     */
    preSendTrans(signedData){
        // TODO: 
        let now = Date.now();
        let record = {
          "HashX"                  : ccUtil.hexTrip0x(this.input.hashX),
          "x"                      : ccUtil.hexTrip0x(this.input.x), // TODO: x is set by create contract data
          "from"                   : ccUtil.hexTrip0x(this.trans.commonData.from),
          "to"                     : ccUtil.hexTrip0x(this.trans.commonData.to),
          "storeman"               : ccUtil.hexTrip0x(this.input.smgBtcAddr),
          "value"                  : this.trans.commonData.value,
          "txValue"                : this.trans.commonData.value,
          "crossAddress"           : "",
          "time"                   : now.toString(),      
          "HTLCtime"               : (2*60*60*1000 + 2 * 1000 * Number(global.lockedTimeBTC) + now).toString(), // TODO: refactory it 
          "suspendTime"            : (1000*Number(global.lockedTimeBTC)+now).toString(),
          "chain"                  : 'BTC',
          "status"                 : 'sentHashPending',
          "lockConfirmed"          : 0,
          "refundConfirmed"        : 0,
          "revokeConfirmed"        : 0,
          "lockTxHash"             : '',
          "refundTxHash"           : '',
          "revokeTxHash"           : '',
          "btcRedeemLockTimeStamp" : 1000 * this.trans.commonData.redeemLockTimeStamp, // TODO: verify if redeemLockTimeStame is exist in WBTC->BTC
          "btcNoticeTxhash"        : '',
          "btcLockTxHash"          : '', // this is txhash of BTC HTLC transaction, we can get it after sent
          "btcRefundTxHash"        : '',
          "btcRevokeTxHash"        : ''
        };
        global.logger.info("CrossChainBtcLock::preSendTrans");
        global.logger.info("collection is :",this.config.crossCollection);
        global.logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
        global.wanDb.insertItem(this.config.crossCollection,record);

        this.retResult.code = true;
        return this.retResult;
    }

    postSendTrans(resultSendTrans){
        global.logger.debug("Entering CrossChainBtcLock::postSendTrans");
        this.retResult.code = true;
        return this.retResult;
    }

    async run() {
        global.logger.debug("Entering CrossChainBtcLock::run");
        //let ret = await CrossChain.prototype.method.call(this);
        let ret = await super.run();
        if(ret.code === false){
            global.logger.error("Lock error:",ret.result);
            return ret;
        }

        if (this.input.chainType == 'BTC') {
            // need to send wan notice
            try {
                let input = JSON.parse(JSON.stringify(this.input));

                input.keypair = this.input.keypair;

                input.from = input.wanAddress;
                input.userH160 = '0x'+bitcoin.crypto.hash160(input.keypair[0].publicKey).toString('hex');
                //input.hashX  = ;
                if (!input.hasOwnProperty('hashX')) {
                    // TODO: Do something !!!
                    //       hashX is generated in BtcLockDataCreator, and passed 
                    //       to this.input
                }
                input.txHash = ret.result;
                input.lockedTimestamp = this.trans.commonData.redeemLockTimeStamp;
                input.chainType       = 'WAN';

                // Fake config, WAN->BTC to get path of wan keystore
                let srcChain = ccUtil.getSrcChainNameByContractAddr('WAN','WAN');
                let dstChain = ccUtil.getSrcChainNameByContractAddr('BTC','BTC');
                let config = global.crossInvoker.getCrossInvokerConfig(srcChain, dstChain);

                let wanNotice = new CrossChainBtcLockNotice(input, config);
                let noticeRet = await wanNotice.run();
                if (noticeRet.code != true) {
                    //wanNotice.postRun(noticeRet.result);
                //} else {
                    global.logger.error("Send WAN notice failed, result=", noticeRet);
                } 
                // TODO: return BTC HTLC TXID???
                ret = noticeRet;
            } catch (error) {
                global.logger.error("Send WAN notice failed, error=", error);
            }
        } else if (this.input.chainType == 'WAN') {
        } else {
            // Oops, should never reach here
            global.logger.error("ChainType error, but we shouldn't go this far!");
        }

        return ret;
    }
}
module.exports = CrossChainBtcLock;
