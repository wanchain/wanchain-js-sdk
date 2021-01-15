'use strict'

let  XrpDataSign           = require('../../data-sign/xrp/XrpDataSign');
let  NormalTxXrpDataCreator= require('../../tx-data-creator/xrp/NormalTxXrpDataCreator');
let  NormalChain           = require('../common/NormalChain');
let  ccUtil                = require('../../../api/ccUtil');
let  error                 = require('../../../api/error');
let  utils                 = require('../../../util/util');

let logger = utils.getLogger('NormalChainXrp.js');

class NormalChainXrp extends NormalChain{
    /**
     * @param: {Object} -
     *     input {
     *         from:           - array, the from addresses
     *         to:             - target address
     *         value:          - amount to send, in satoshi !!!
     *         feeRate:        -
     *         changeAddress:  - address to send if there's any change
     *     }
     * @param: {Object} -
     *     config {
     *     }
     */
    constructor(input, config) {
        super(input, config);
    }

    createDataCreator(){
        logger.debug("Entering NormalChainXrp::createDataCreator");

        this.retResult.code    = true;
        this.retResult.result  = new NormalTxXrpDataCreator(this.input, this.config);

        logger.debug("NormalChainXrp::createDataCreator is completed");
        return this.retResult;
    }

    createDataSign(){
        logger.debug("Entering NormalChainXrp::createDataSign");

        this.retResult.code    = true;
        this.retResult.result  = new XrpDataSign(this.input, this.config);

        logger.debug("NormalChainXrp::createDataSign is completed");
        return this.retResult;
    }

    preSendTrans(signedData){
        logger.debug("Entering NormalChainXrp::preSendTrans");

        let record = {
            "hashX" : this.input.hashX,  // input.hashX is generated by NormalChain
            "from"  : this.trans.commonData.from,
            "to"    : this.trans.commonData.to,
            "value" : this.trans.commonData.value.toString(10),
            "sendTime"  : parseInt(Number(Date.now())/1000).toString(),
            "sentTime"  : "",
            "txHash": this.input.hashX,
            "chain" : 'XRP',
            "chainAddr" :this.config.srcSCAddrKey,
            "chainType" :this.config.srcChainType,
            "tokenSymbol" :this.config.tokenSymbol,
            "status": "Sending",
            "tag": this.input.tag || ""
        };
        logger.info("NormalChainXrp::preSendTrans");
        logger.info("collection is :",this.config.normalCollection);
        logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
        /**
         * TODO: XRP normal tx doesn't save data in db
         */
        global.wanDb.insertItem(this.config.normalCollection,record);
        this.retResult.code = true;

        logger.debug("NormalChainXrp::preSendTrans is completed");
        return this.retResult;
    }

    /**
     * @override
     */
    transFailed(){
      logger.debug("Entering NormalChainXrp::transFailed");
      logger.debug("collection is :",this.config.normalCollection);

      let hashX  = this.input.hashX;
      let record = global.wanDb.getItem(this.config.normalCollection,{hashX:hashX});

      if (record) {
          record.status = "Failed";

          logger.debug("record is :",ccUtil.hiddenProperties(record,['x']));
          global.wanDb.updateItem(this.config.normalCollection,{hashX:record.hashX},record);

          this.retResult.code = true;
      } else {
          logger.error("Transaction not found: ", hashX);
          this.retResult.data = new error.NotFound("Transaction not found");
          this.retResult.code = false;
      }

      logger.debug("NormalChainXrp::transFailed is completed");
      return this.retResult;
    }

    postSendTrans(resultSendTrans){
        logger.debug("Entering NormalChainXrp::postSendTrans");

        let hashX       = this.input.hashX;
        let record      = global.wanDb.getItem(this.config.normalCollection,{hashX:hashX});

        if (record) {
            /**
             * WARNING: XRP normal tx doesn't save data in db, save sucess directly
             */
            record.status   = 'Sent';
            record.txHash   = ccUtil.hexTrip0x(resultSendTrans);
            let cur         = parseInt(Number(Date.now())/1000).toString();
            record.sentTime = cur;

            logger.debug("collection is :",this.config.normalCollection);
            logger.debug("record is :",ccUtil.hiddenProperties(record,['x']));
            global.wanDb.updateItem(this.config.normalCollection,{hashX:record.hashX},record);

            this.retResult.code = true;
        } else {
            logger.error("Transaction not found: ", hashX);
            this.retResult.data = new error.NotFound("Transaction not found");
            this.retResult.code = false;
        }

        logger.debug("NormalChainXrp::postSendTrans is completed");
        return this.retResult;
    }
}

module.exports = NormalChainXrp;
