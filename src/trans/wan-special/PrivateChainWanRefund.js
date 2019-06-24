'use strict'
let Transaction = require('../transaction/common/Transaction');
let WanDataSign = require('../data-sign/wan/WanDataSign');
let NormalChain = require('../normal-chain/common/NormalChain');
let CrossStatus = require('../status/Status').CrossStatus;
let PrivateRefundTxWanDataCreator = require('../tx-data-creator/wan/PrivateRefundTxWanDataCreator');

let ccUtil = require('../../api/ccUtil');
let error  = require('../../api/error');
let utils  = require('../../util/util');

let logger = utils.getLogger('PrivateChainWanRefund.js');

/**
 * @class
 * @augments NormalChain
 */
class PrivateChainWanRefund extends NormalChain{
    /**
     * @constructor
     * @param {Object} input  - {@link CrossChain#input input} of final users.(gas, gasPrice, value and so on)
     * @param {Object} config - {@link CrossChain#config config} of cross chain used.
     */
    constructor(input, config) {
        super(input, config);
        this.input.chainType = config.srcChainType;

        let x            = ccUtil.generatePrivateKey();
        this.input.hashX = ccUtil.getHashKey(x);

    }

    /**
     * Same with {@link CrossChain#checkPreCondition CrossChain#checkPreCondition}
     * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
     */
    checkPreCondition(){
        this.retResult.code = false;
        if (!this.input.hasOwnProperty('from')) {
            logger.error("Input missing attribute 'from'");
            this.retResult.result = new error.InvalidParameter("Input missing attribute 'from'")
        } else if (!this.input.hasOwnProperty('walletID')) {
            logger.error("Input missing attribute 'walletID'");
            this.retResult.result = new error.InvalidParameter("Input missing attribute 'walletID'")
        } else if (!this.input.hasOwnProperty('BIP44Path')) {
            logger.error("Input missing attribute 'BIP44Path'");
            this.retResult.result = new error.InvalidParameter("Input missing attribute 'BIP44Path'")
        } else if (!this.input.hasOwnProperty('OTA')) {
            logger.error("Input missing attribute 'OTA'");
            this.retResult.result = new error.InvalidParameter("Input missing attribute 'OTA'")
        } else if (!this.input.hasOwnProperty('otaTxHash')) {
            logger.error("Input missing attribute 'otaTxHash'");
            this.retResult.result = new error.InvalidParameter("Input missing attribute 'otaTxHash'")
        } else if (!this.input.hasOwnProperty('amount')) {
            logger.error("Input missing attribute 'amount'");
            this.retResult.result = new error.InvalidParameter("Input missing attribute 'amount'")
        } else if (!this.input.hasOwnProperty('gasPrice')) {
            logger.error("Input missing attribute 'gasPrice'");
            this.retResult.result = new error.InvalidParameter("Input missing attribute 'gasPrice'")
        } else if (!this.input.hasOwnProperty('gasLimit')) {
            logger.error("Input missing attribute 'gasLimit'");
            this.retResult.result = new error.InvalidParameter("Input missing attribute 'gasLimit'")
        } else {
            this.retResult.code = true;
        }

        return this.retResult;
    }

    createDataCreator(){
        logger.debug("Entering PrivateChainWanRefund::createDataCreator");
        this.retResult.code = true;
        this.retResult.result = new PrivateRefundTxWanDataCreator(this.input,this.config);
        logger.debug("PrivateChainWanRefund::createDataCreator is completed.");
        return this.retResult;
    }

    createDataSign(){
        logger.debug("Entering PrivateChainWanRefund::createDataSign");

        this.retResult.code = true;
        if (this.input.chainType === 'WAN'){
          this.retResult.result = new WanDataSign(this.input,this.config);
        }else{
          this.retResult.code  = false;
          this.retResult.result= error.RuntimeError("chainType is error.");
        }

        logger.debug("PrivateChainWanRefund::createDataSign is completed, result=", this.retResult.code);
        return this.retResult;
    }

    preSendTrans(signedData){
        let record = {
            "hashX"       : this.input.hashX,
            "txHash"      : "",
            "from"        : this.trans.commonData.from,
            "to"          : this.trans.commonData.to,
            "value"       : this.trans.commonData.value,
            "gasPrice"    : this.trans.commonData.gasPrice,
            "gasLimit"    : this.trans.commonData.gasLimit,
            "nonce"       : this.trans.commonData.nonce,
            "sendTime"    : parseInt(Number(Date.now())/1000).toString(),
            "sentTime"    : "",
            "successTime" : "",
            "chainAddr"   : this.config.srcSCAddrKey,
            "chainType"   : this.config.srcChainType,
            "tokenSymbol" : this.config.tokenSymbol,
            "status"      : 'Sending',
            "annotate"    : 'PrivateRefund',
            "otaTxHash"   : this.input.otaTxHash
        };

        logger.debug("PrivateChainWanRefund::preSendTrans");
        logger.debug("record is :",ccUtil.hiddenProperties(record,['x']));
        global.wanDb.insertItem(this.config.normalCollection,record);
        this.retResult.code = true;

        return this.retResult;
    }

    /**
     * @override
     */
    transFailed(){
        let hashX  = this.input.hashX;
        let record = global.wanDb.getItem(this.config.normalCollection, {hashX:hashX});

        record.status = "Failed";
        logger.error("PrivateChainWanRefund::transFailed");
        logger.error("record is :",ccUtil.hiddenProperties(record,['x']));
        global.wanDb.updateItem(this.config.normalCollection,{hashX:record.hashX},record);
        this.retResult.code = true;

        return this.retResult;
    }

    handleSendTranError(err) {
        try {
            let otaTbl = global.wanScanDB.getUsrOTATable();

            let record = otaTbl.read(this.input.otaTxHash)
            if (!record) {
                logger.error("Record for OTA not found, txhash=", this.input.otaTxHash);
                return false;
            }

            let errStr = err.toString();
            logger.error("handle error: ", errStr)
            if(errStr.indexOf('OTA is reused') >= 0 ) {
                logger.info("Ota is reused, txhash=", this.input.otaTxHash);

                record.state = "Refund";
                otaTbl.update(this.input.otaTxHash, record);

                return true;
            }else if(errStr.indexOf("can't find ota address balance!") >= 0 ) {
                log.warn("Can't find ota address balance, set status as refund, txhash=", this.input.otaTxHash);
                record.state = "Refund";
                otaTbl.update(this.input.otaTxHash, record);

                return true;
            }
        } catch(error) {
            logger.error("Caught error when handling send tx failure:", error);
        }

        return false;
    }

    postSendTrans(resultSendTrans){
        logger.debug("Entering PrivateChainWanRefund::postSendTrans");

        let txHash      = resultSendTrans;
        let hashX       = this.input.hashX;
        let record      = global.wanDb.getItem(this.config.normalCollection,{hashX:hashX});
        record.status   = 'Sent';
        record.txHash   = txHash;
        let cur         = parseInt(Number(Date.now())/1000).toString();
        record.sentTime = cur;
        logger.debug("PrivateChainWanRefund::postSendTrans");
        logger.debug("record is :",ccUtil.hiddenProperties(record,['x']));
        global.wanDb.updateItem(this.config.normalCollection,{hashX:record.hashX},record);

        this.retResult.code = true;
        logger.debug("PrivateChainWanRefund::postSendTrans is completed.");
        return this.retResult;
    }
}

module.exports = PrivateChainWanRefund;
