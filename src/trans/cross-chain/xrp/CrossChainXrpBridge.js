let utils = require('../../../util/util');
let ccUtil = require('../../../api/ccUtil');
let CrossChain = require('../common/CrossChain');
let XrpDataSign = require('../../data-sign/xrp/XrpDataSign');
let BridgeTxXrpDataCreator = require('../../tx-data-creator/xrp/BridgeTxXrpDataCreator');

const logger = utils.getLogger("CrossChainXrpBridge.js");

class CrossChainXrpBridge extends CrossChain {
  constructor(input, config) {
    super(input, config);
    this.input.chainType = config.srcChainType;
  }

  createDataCreator() {
    logger.debug("Entering CrossChainXrpBridge::createDataCreator");
    this.retResult.code = true;
    if (this.input.chainType === 'XRP') {
      this.retResult.result = new BridgeTxXrpDataCreator(this.input, this.config);
    } else {
      logger.error("Chain type invalid: ", this.input.chainType);
      this.retResult.code = false;
      this.retResult.result = "ChainType error.";
    }
    logger.debug("CrossChainXrpBridge::createDataCreator is completed");
    return this.retResult;
  }

  createDataSign() {
    logger.debug("Entering CrossChainXrpBridge::createDataSign");
    this.retResult.code = true;
    if (this.input.chainType === 'XRP') {
      this.retResult.result = new XrpDataSign(this.input, this.config);
    } else {
      logger.error("Chain type invalid: ", this.input.chainType);
      this.retResult.code = false;
      this.retResult.result = "ChainType error.";
    }
    logger.debug("CrossChainXrpBridge::createDataCreator is completed");
    return this.retResult;
  }

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  preSendTrans(signedData) {
    logger.debug("Entering CrossChainXrpBridge::preSendTrans");
    let record = {
      to: this.input.to,
      from: this.input.from,
      toAddr: this.trans.commonData.wanAddress,
      fromAddr: this.trans.commonData.from,
      smgXrpAddr: this.input.smgXrpAddr,
      storeman: this.input.storeman,
      crosschainFee: this.input.crosschainFee,
      receivedAmount: this.input.receivedAmount,
      "hashX": ccUtil.hexTrip0x(this.input.hashX),
      "x": ccUtil.hexTrip0x(this.input.x),
      "tokenPairID": this.input.tokenPairID,
      "value": this.trans.commonData.value,
      "contractValue": ccUtil.tokenToWeiHex(this.trans.commonData.value, this.config.tokenDecimals),
      "crossValue": ccUtil.hexAdd0x(ccUtil.tokenToWeiHex(this.input.receivedAmount, this.config.tokenDecimals)),
      "sendTime": parseInt(Number(Date.now()) / 1000).toString(),
      "htlcTimeOut": "",
      "buddyLockedTimeOut": "",
      "chain": this.input.chainType,
      "status": 'LockSending',
      "lockTxHash": "",
      "redeemTxHash": "",
      "revokeTxHash": "",
      "buddyLockTxHash": "",
      "tokenSymbol": this.config.tokenSymbol,
      "tokenStand": this.config.tokenStand,
      "srcChainAddr": this.config.srcSCAddrKey,
      "dstChainAddr": this.config.dstSCAddrKey,
      "srcChainType": this.config.srcChainType,
      "dstChainType": this.config.dstChainType,
      "crossMode": this.config.crossMode,
      "smgCrossMode": this.config.smgCrossMode,
      "crossType": this.input.crossType,
      "LastLedgerSequence": this.input.LastLedgerSequence || 0
    };

    logger.debug("CrossChainXrpBridge::preSendTrans");
    logger.debug("collection is :", this.config.crossCollection);
    logger.debug("record is :", ccUtil.hiddenProperties(record, ['x']));

    global.wanDb.insertItem(this.config.crossCollection, record);

    this.retResult.code = true;
    logger.debug("CrossChainXrpBridge::preSendTrans is completed");

    return this.retResult;
  }

  postSendTrans(resultSendTrans) {
    logger.debug("Entering CrossChainXrpBridge::postSendTrans");
    logger.info("collection is :", this.config.crossCollection);

    let record = global.wanDb.getItem(this.config.crossCollection, {
      hashX: ccUtil.hexTrip0x(this.input.hashX)
    });

    if (record) {
      record.status = "LockSent";
      record.lockTxHash = resultSendTrans;

      global.wanDb.updateItem(this.config.crossCollection, {
        hashX: record.hashX
      }, record);
      this.retResult.code = true;
    } else {
      this.retResult.code = false;
      logger.error("Post send tx, update record not found, hashx=", this.input.hashX);
    }

    logger.debug("CrossChainXrpBridge::postSendTrans is completed");

    return this.retResult;
  }

  /**
   * @override
   */
  transFailed() {
    logger.info("CrossChainXrpBridge::transFailed");
    let record = global.wanDb.getItem(this.config.crossCollection, {
      hashX: ccUtil.hexTrip0x(this.input.hashX)
    });
    if (record) {
      record.status = 'sentHashFailed';
      logger.debug("record is :", ccUtil.hiddenProperties(record, ['x']));
      global.wanDb.updateItem(this.config.crossCollection, {
        hashX: record.hashX
      }, record);
    }
    this.retResult.code = true;
    return this.retResult;
  }

  async run(isSend) {
    logger.debug("Entering CrossChainXrpBridge::run");
    let ret = await super.run(isSend);
    if (!isSend) {
      return ret;
    }
    if (ret.code === false) {
      logger.error("%s Lock error:", this.input.chainType, ret.result);
      return ret;
    }

    logger.debug("CrossChainXrpBridge::run completed!");

    return ret;
  }
}
module.exports = CrossChainXrpBridge;