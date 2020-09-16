'use strict'
let Transaction = require('../transaction/common/Transaction');
let WanDataSign = require('../data-sign/wan/WanDataSign');
let NormalChain = require('../normal-chain/common/NormalChain');
let CrossStatus = require('../status/Status').CrossStatus;
let DelegateDataCreator = require('../tx-data-creator/wan/DelegateDataCreator');

let ccUtil = require('../../api/ccUtil');
let error  = require('../../api/error');
let utils  = require('../../util/util');

let logger = utils.getLogger('PosDelegateOut.js');

/**
 * @class
 * @augments NormalChain
 */
class PosDelegateOut extends NormalChain{
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
        this.input.func  = 'delegateOut';

        // amount is zero for delegate out
        this.input.amount = 0;

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
        } else if (!this.input.hasOwnProperty('validatorAddr')) {
            logger.error("Input missing attribute 'validatorAddr'");
            this.retResult.result = new error.InvalidParameter("Input missing attribute 'validatorAddr'");
        } else if (!this.input.hasOwnProperty('gasPrice')) {
            logger.error("Input missing attribute 'gasPrice'");
            this.retResult.result = new error.InvalidParameter("Input missing attribute 'gasPrice'");
        } else if (!this.input.hasOwnProperty('gasLimit')) {
            logger.error("Input missing attribute 'gasLimit'");
            this.retResult.result = new error.InvalidParameter("Input missing attribute 'gasLimit'");
        } else {
            this.retResult.code = true;
        }

        return this.retResult;
    }

    createDataCreator(){
        logger.debug("Entering PosDelegateOut::createDataCreator");
        this.retResult.code = true;
        this.retResult.result = new DelegateDataCreator(this.input, this.config);
        logger.debug("PosDelegateOut::createDataCreator is completed.");
        return this.retResult;
    }

    createDataSign(){
        logger.debug("Entering PosDelegateOut::createDataSign");

        this.retResult.code = true;
        if (this.input.chainType === 'WAN'){
          this.retResult.result = new WanDataSign(this.input,this.config);
        }else{
          this.retResult.code  = false;
          this.retResult.result= new error.RuntimeError("chainType is error.");
        }

        logger.debug("PosDelegateOut::createDataSign is completed, result=", this.retResult.code);
        return this.retResult;
    }

    preSendTrans(signedData){
        let record = {
            "hashX"       : this.input.hashX,
            "txHash"      : "",
            "from"        : this.trans.commonData.from,
            "to"          : this.trans.commonData.to,
            "validator"   : this.input.validatorAddr,
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
            "stakeAmount" : this.input.stakeAmount ? this.input.stakeAmount : "",
            "status"      : 'Sending',
            "annotate"    : 'DelegateOut'
        };

        logger.debug("PosDelegateOut::preSendTrans");
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
        logger.error("PosDelegateOut::transFailed");
        logger.error("record is :",ccUtil.hiddenProperties(record,['x']));
        global.wanDb.updateItem(this.config.normalCollection,{hashX:record.hashX},record);
        this.retResult.code = true;

        return this.retResult;
    }

    handleSendTranError(err) {
        // Do not handle

        return false;
    }

    postSendTrans(resultSendTrans){
        logger.debug("Entering PosDelegateOut::postSendTrans");

        let txHash      = resultSendTrans;
        let hashX       = this.input.hashX;
        let record      = global.wanDb.getItem(this.config.normalCollection,{hashX:hashX});
        record.status   = 'Sent';
        record.txHash   = txHash;
        let cur         = parseInt(Number(Date.now())/1000).toString();
        record.sentTime = cur;
        logger.debug("PosDelegateOut::postSendTrans");
        logger.debug("record is :",ccUtil.hiddenProperties(record,['x']));
        global.wanDb.updateItem(this.config.normalCollection,{hashX:record.hashX},record);

        this.retResult.code = true;
        logger.debug("PosDelegateOut::postSendTrans is completed.");
        return this.retResult;
    }
}

module.exports = PosDelegateOut;
