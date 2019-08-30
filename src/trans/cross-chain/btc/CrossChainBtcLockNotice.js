'use strict'

let utils                  = require('../../../util/util');
let ccUtil                 = require('../../../api/ccUtil');
let error                  = require('../../../api/error');
let Transaction            = require('../../transaction/common/Transaction');
let BtcDataSignWan         = require('../../data-sign/wan/WanDataSign');
let LockNoticeDataCreator  = require('../../tx-data-creator/btc/LockNoticeDataCreator');
let CrossChain             = require('../common/CrossChain');

const logger = utils.getLogger('CrossChainBtcLockNotice.js');

class CrossChainBtcLockNotice extends CrossChain{
    /**
     * Send notice to WAN after BTC lock.
     *   Wallet sends BTC to p2sh address, that storeman couldn't know about it,
     * so needs manually send notice
     *
     * @param: {Object} - input
     *    {
     *        storeman         -- WAN address of storeman
     *        userH160         --
     *        hashX            --
     *        txHash           -- btc TX hash
     *        lockedTimestamp  --
     *
     *        from        -- { path: , walletID: }
     *        gasPrice    --
     *        gas         --
     *        password    -- WAN password
     *    }
     */
    constructor(input,config) {
        super(input,config);
        // NOTICE: Suppose source chain is WAN !!!
        this.input.chainType = config.srcChainType;
        this.input.keystorePath = config.srcKeystorePath;
    }

    /**
     * Same with {@link CrossChain#checkPreCondition CrossChain#checkPreCondition}
     * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
     */
    checkPreCondition(){
        logger.debug("Entering CrossChainBtcLockNotice::checkPreCondition");
        // Asssume failed firstly
        this.retResult.code = false;
        if (!this.input.hasOwnProperty('from')){
            logger.error("Input missing attribute 'from'");
            this.retResult.result = new error.InvalidParameter("Input missing attribute 'from'");
            return this.retResult;
        }
        if (!this.input.hasOwnProperty('storeman')){
            logger.error("Input missing attribute 'storeman'");
            this.retResult.result = new error.InvalidParameter("Input missing attribute 'storeman'");
            return this.retResult;
        }
        if (!this.input.hasOwnProperty('userH160')){
            logger.error("Input missing attribute 'userH160'");
            this.retResult.result = new error.InvalidParameter("Input missing attribute 'userH160'");
            return this.retResult;
        }
        if (!this.input.hasOwnProperty('gasPrice')){
            logger.error("Input missing attribute 'gasPrice'");
            this.retResult.result = new error.InvalidParameter("Input missing attribute 'gasPrice'");
            return this.retResult;
        }
        if (!this.input.hasOwnProperty('gas')){
            logger.error("Input missing attribute 'gas'");
            this.retResult.result = new error.InvalidParameter("Input missing attribute 'gas'");
            return this.retResult;
        }
        if (!this.input.hasOwnProperty('hashX')){
            logger.error("Input missing attribute 'hashX'");
            this.retResult.result = new error.InvalidParameter("Input missing attribute 'hashX'");
            return this.retResult;
        }
        if (!this.input.hasOwnProperty('txHash')){
            logger.error("Input missing attribute 'txHash'");
            this.retResult.result = new error.InvalidParameter("Input missing attribute 'txHash'");
            return this.retResult;
        }
        if (!this.input.hasOwnProperty('lockedTimestamp')){
            logger.error("Input missing attribute 'lockedTimeStamp'");
            this.retResult.result = new error.InvalidParameter("Input missing attribute 'lockedTimeStamp'");
            return this.retResult;
        }

        // No more need to check
        logger.debug("CrossChainBtcLockNotice::checkPreCondition is completed.");
        this.retResult.code = true;
        return this.retResult;
    }

    createTrans(){
        logger.debug("Entering CrossChainBtcLockNotice::createTrans");
        this.retResult.code = true;
        this.retResult.result = new Transaction(this.input, this.config);
        logger.debug("CrossChainBtcLockNotice::createTrans completed.");
        return this.retResult;
    }

    createDataCreator(){
        logger.debug("Entering CrossChainBtcLockNotice::createDataCreator");
        this.retResult.code = true;
        this.retResult.result = new LockNoticeDataCreator(this.input, this.config);
        logger.debug("CrossChainBtcLockNotice::createDataCreator completed.");
        return this.retResult;
    }

    createDataSign(){
        logger.debug("Entering CrossChainBtcLockNotice::createDataSign");
        this.retResult.code = true;
        this.retResult.result = new BtcDataSignWan(this.input, this.config);
        logger.debug("CrossChainBtcLockNotice::createDataSign completed.");
        return this.retResult;
    }

    /**
     * @override
     * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
     */
    preSendTrans(signedData){
        // TODO:
        logger.info("Entering CrossChainBtcLockNotice::preSendTrans");
        logger.debug("collection is :",this.config.crossCollection);
        logger.info("CrossChainBtcLockNotice::preSendTrans completed.");
        this.retResult.code = true;
        return this.retResult;
    }

    postSendTrans(resultSendTrans){
        logger.debug("Entering CrossChainBtcLockNotice::postSendTrans");
        logger.debug("collection is :",this.config.crossCollection);

        let hashX = ccUtil.hexTrip0x(this.input.hashX);
        let record = global.wanDb.getItem(this.config.crossCollection,{hashX: hashX});
        if (record) {
            //record.btcLockTxHash = this.input.txHash;
            record.crossAddress  = ccUtil.hexTrip0x(this.input.fromAddr);
            record.wanAddress  = this.input.from;
            record.btcNoticeTxhash  = ccUtil.hexTrip0x(resultSendTrans);
            record.status        = "sentHashPending";

            logger.debug("record is :",ccUtil.hiddenProperties(record,['x']));
            global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
            this.retResult.code = true;
        } else {
            this.retResult.code = false;
            logger.debug("BTC post sent notice, record not found, hashx=", hashX);
        }

        logger.debug("CrossChainBtcLockNotice::postSendTrans is completed.");
        return this.retResult;
    }
}
module.exports = CrossChainBtcLockNotice;
