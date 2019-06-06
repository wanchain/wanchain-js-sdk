'use strict'

const bitcoin = require('bitcoinjs-lib');

let utils                   = require('../../../util/util');
let ccUtil                  = require('../../../api/ccUtil');
let btcUtil                 = require('../../../api/btcUtil');
let Transaction             = require('../../transaction/common/Transaction');
let BtcTransaction          = require('../../transaction/btc/BtcTransaction');
let BtcDataSign             = require('../../data-sign/btc/BtcDataSign');
let WanDataSign             = require('../../data-sign/wan/WanDataSign');
let LockTxBtcDataCreator    = require('../../tx-data-creator/btc/LockTxBtcDataCreator');
let LockTxWbtcDataCreator   = require('../../tx-data-creator/btc/LockTxWbtcDataCreator');
let CrossChain              = require('../common/CrossChain');
let CrossChainBtcLockNotice = require('./CrossChainBtcLockNotice');

const logger = utils.getLogger("CrossChainBtcLock.js");

class CrossChainBtcLock extends CrossChain {
    /**
     * @param: {Object} - input
     *    For BTC:
     *    {
     *        smgBtcAddr  - smgBtcAddr address
     *        from:       - array, from address to lock
     *        value       - amount to send in sto
     *        feeRate     -
     *        changeAddress  - address to send if there's any change
     *        password    -  NOTICE: password of WAN !!!
     *        storeman    - WAN address of storeman group
     *        wanAddress  -
     *            path
     *            walletID
     *        gas         -
     *        gasPrice    -
     *    }
     *    For WBTC:
     *    {
     *        from        -- wan address, BIP44 path
     *            path
     *            walletID
     *        password    -- password of wan account, optional
     *        amount      --
     *        value       -- wan fee
     *        storeman    -- wanAddress of syncStoremanGroups
     *        crossAddr   -- BTC BIP44 path, to compute H160 address
     *            path
     *            walletID
     *        gas         --
     *        gasPrice    --
     *        x           -- optional, key
     *    }
     */
    constructor(input,config) {
        super(input,config);
        this.input.chainType = config.srcChainType;
        // Key store path is only used for WBTC (wan account)
        this.input.keystorePath = config.srcKeystorePath;
    }

    createTrans(){
        logger.debug("Entering CrossChainBtcLock::createTrans");
        this.retResult.code = true;
        if (this.input.chainType == 'BTC') {
            this.retResult.result = new BtcTransaction(this.input, this.config);
        } else if (this.input.chainType == 'WAN') {
            this.retResult.result = new Transaction(this.input, this.config);
        } else {
            logger.error("Chain type invalid: ", this.input.chainType);
            this.retResult.code   = false;
            this.retResult.result = "ChainType error.";
        }
        logger.debug("CrossChainBtcLock::createTrans is completed");
        return this.retResult;
    }

    createDataCreator(){
        logger.debug("Entering CrossChainBtcLock::createDataCreator");
        this.retResult.code = true;
        if (this.input.chainType == 'BTC') {
            this.retResult.result = new LockTxBtcDataCreator(this.input,this.config);
        } else if (this.input.chainType == 'WAN') {
            this.retResult.result = new LockTxWbtcDataCreator(this.input, this.config);
        } else {
            logger.error("Chain type invalid: ", this.input.chainType);
            this.retResult.code   = false;
            this.retResult.result = "ChainType error.";
        }
        logger.debug("CrossChainBtcLock::createDataCreator is completed");
        return this.retResult;
    }

    createDataSign(){
        logger.debug("Entering CrossChainBtcLock::createDataSign");
        this.retResult.code = true;
        if (this.input.chainType == 'BTC') {
            this.retResult.result = new BtcDataSign(this.input,this.config);
        } else if (this.input.chainType == 'WAN') {
            this.retResult.result = new WanDataSign(this.input, this.config);
        } else {
            logger.error("Chain type invalid: ", this.input.chainType);
            this.retResult.code   = false;
            this.retResult.result = "ChainType error.";
        }
        logger.debug("CrossChainBtcLock::createDataCreator is completed");
        return this.retResult;
    }

    /**
     * @override
     * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
     */
    preSendTrans(signedData){
        logger.debug("Entering CrossChainBtcLock::preSendTrans");
        // TODO:
        let now = Date.now();
        let storeman;
        let from;
        let to;
        let amount;
        let crossAddr = '';
        let btcRedeemTS = 0;

        if (this.input.chainType == 'BTC') {
            // corssAddress is set after send wan notice
            storeman = ccUtil.hexTrip0x(this.input.smgBtcAddr);
            from = this.trans.commonData.from;
            to   = ccUtil.hexTrip0x(this.trans.commonData.to);
            btcRedeemTS = 1000 * this.trans.commonData.redeemLockTimeStamp;
            // Amount is the total number to send, value is tx fee,
            // but in BTC SDK it saves amount same as value
            amount = this.trans.commonData.value;
        } else {
            // WBTC contract doesn't have redeem timestamp, it will filled by monitor
            //storeman = ccUtil.hexTrip0x(this.input.storeman);
            storeman = this.input.storeman;
            //from = this.trans.commonData.from;
            from = this.input.from;
            to   = this.trans.commonData.to;
            crossAddr = this.input.h160CrossAddr;
            amount = this.input.amount;
        }

        // TODO: hashX & x are generated by create contract, and passed back to input, may need another way to pass it!!!
        let record = {
          "hashX"                  : ccUtil.hexTrip0x(this.input.hashX),
          "x"                      : ccUtil.hexTrip0x(this.input.x), // TODO: x is set by create contract data
          "from"                   : from,
          "to"                     : to,
          "storeman"               : storeman,
          "value"                  : amount,
          "txValue"                : this.trans.commonData.value,
          "crossAddress"           : crossAddr,
          "time"                   : now.toString(),
          "HTLCtime"               : (2*60*60*1000 + 2 * 1000 * Number(global.lockedTimeBTC) + now).toString(), // TODO: refactory it
          "suspendTime"            : (1000*Number(global.lockedTimeBTC)+now).toString(),
          "chain"                  : this.input.chainType,
          "status"                 : 'sentHashPending',
          "lockConfirmed"          : 0,
          "refundConfirmed"        : 0,
          "revokeConfirmed"        : 0,
          "lockTxHash"             : '',
          "refundTxHash"           : '',
          "revokeTxHash"           : '',
          "btcRedeemLockTimeStamp" : btcRedeemTS,
          "btcNoticeTxhash"        : '',
          "btcLockTxHash"          : '', // this is txhash of BTC HTLC transaction, we can get it after sent
          "btcRefundTxHash"        : '',
          "btcRevokeTxHash"        : ''
        };

        logger.debug("CrossChainBtcLock::preSendTrans");
        logger.debug("collection is :",this.config.crossCollection);
        logger.debug("record is :",ccUtil.hiddenProperties(record,['x']));

        global.wanDb.insertItem(this.config.crossCollection,record);

        this.retResult.code = true;
        logger.debug("CrossChainBtcLock::preSendTrans is completed");

        return this.retResult;
    }

    postSendTrans(resultSendTrans){
        logger.debug("Entering CrossChainBtcLock::postSendTrans");
        logger.info("collection is :",this.config.crossCollection);

        let record = global.wanDb.getItem(this.config.crossCollection,{hashX: ccUtil.hexTrip0x(this.input.hashX)});

        if (record) {
            if (this.input.chainType == 'BTC') {
                // TODO: need trip???
                record.btcLockTxHash = resultSendTrans;
            } else {
                record.lockTxHash = ccUtil.hexTrip0x(resultSendTrans);
                record.btcCrossAddr = this.input.crossAddr;
            }

            global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
            this.retResult.code = true;
        } else {
            this.retResult.code = false;
            logger.error("Post send tx, update record not found, hashx=", this.input.hashX);
        }

        logger.debug("CrossChainBtcLock::postSendTrans is completed");

        return this.retResult;
    }

    /**
     * @override
     */
    transFailed(){
      logger.info("CrossChainBtcLock::transFailed");
      let record = global.wanDb.getItem(this.config.crossCollection,{hashX: ccUtil.hexTrip0x(this.input.hashX)});
      if (record) {
          record.status = 'sentHashFailed';
          logger.debug("record is :",ccUtil.hiddenProperties(record,['x']));
          global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
      }
      this.retResult.code = true;
      return this.retResult;
    }

    async addNonceHoleToList(){
        if (this.input.chainType == 'BTC') {
            logger.info("addNonceHoleToList, skipped");
        } else {
            return super.addNonceHoleToList();
        }
    }

    async run() {
        logger.debug("Entering CrossChainBtcLock::run");
        //let ret = await CrossChain.prototype.method.call(this);
        let ret = await super.run();
        if(ret.code === false){
            logger.error("%s Lock error:", this.input.chainType, ret.result);
            return ret;
        }

        if (this.input.chainType == 'BTC') {
            // need to send wan notice
            try {
                logger.info("Lock BTC, sending WAN notice...");

                let input = {
                    "storeman" : this.input.storeman,
                    "gasPrice" : this.input.gasPrice,
                    "gas" : this.input.gas,
                };

                if (typeof this.input.password === 'string') {
                    input.password = this.input.password;
                }

                // to indicate using HD wallet
                input.walletID = this.input.wanAddress.walletID;
                input.BIP44Path = this.input.wanAddress.path;
                input.from = this.input.wanAddress;
                input.userH160 = '0x'+bitcoin.crypto.hash160(this.trans.keypair[0].publicKey).toString('hex');

                let hashX;
                //input.hashX  = ;
                // WARNING: input.hashX shouldn't have '0x' prefix !!!
                if (!this.input.hasOwnProperty('hashX')) {
                    // TODO: Do something !!!
                    //       hashX is generated in BtcLockDataCreator, and passed
                    //       to this.input
                    hashX   = this.trans.commonData["hashX"];
                } else {
                    hashX   = this.input.hashX;
                }

                let txHash  = ccUtil.hexAdd0x(ret.result);

                input.hashX  = ccUtil.hexAdd0x(hashX);
                input.txHash = txHash;
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
                    logger.error("Sent WAN notice failed, result=", noticeRet);
                }
                // TODO: return BTC HTLC TXID???
                ret = noticeRet;
            } catch (error) {
                logger.error("Caught error when sending WAN notice:", error);
            }
        } else if (this.input.chainType == 'WAN') {
            logger.debug("Lock WBTC done.");
        } else {
            // Oops, should never reach here
            logger.error("ChainType error, but we shouldn't go this far...");
        }

        logger.debug("CrossChainBtcLock::run completed!");

        return ret;
    }
}
module.exports = CrossChainBtcLock;
