'use strict'
const ccUtil    = require('../api/ccUtil');
const BigNumber = require('bignumber.js');
const utils     = require('../util/util');
let  logger;

let self;

let timerStart   = 11000;
let timerInterval= 11000;

let handlingList = {};
/**
 * Used to monitor the normal transaction status.
 *
 */
const MonitorRecordNormal   = {
    async init(config){
        this.config           = config;
        this.normalCollection = config.normalCollection;
        this.name             = "monitorNormal";
        this.done = false;

        self = this;
        handlingList = {};

        logger = utils.getLogger("monitorNormal.js");

        self.timer = setTimeout(function() {
            self.monitorTaskNormal();
        }, timerStart);
    },

    shutdown() {
        this.done = true;
        // handlingList = {};

        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    },

    receiptFailOrNot(receipt, record){
        if(receipt && !(receipt.status === '0x1' || (record.chainType === 'EOS' && receipt.trx.receipt.status == 'executed'))){
            return true;
        }
        return false;
    },

    async waitNormalConfirm(record){
        if (self.done) {
            logger.info("Server shuting down...");
            return
        }
        try{
            logger.debug("record = %s",JSON.stringify(record, null, 4));
            logger.debug("Entering waitNormalConfirm, txHash = %s",record.txHash);
            let options = {};
            if (record.chainType === 'EOS' && record.txBlockNumber !== "undefined") {
                // options.blockNumHint = record.txBlockNumber;
            }
            let receipt = await ccUtil.waitConfirm(record.txHash, this.config.confirmBlocks, record.chainType, options);
            logger.debug("%%%%%%%%%%%%%%%%%%%%%%%response from waitNormalConfirm%%%%%%%%%%%%%%%%%%%%%");
            logger.debug("response from waitNormalConfirm, txHash = %s",record.txHash);

            logger.debug("receipt: %s", JSON.stringify(receipt, null, 4));
            if(receipt && ((receipt.hasOwnProperty('blockNumber') && receipt.status === '0x1') || (record.chainType === 'EOS' && receipt.hasOwnProperty('block_num') && receipt.trx.receipt.status === 'executed'))){
                record.status       = 'Success';

                let chainType       = record.chainType;
                let newTime; // unit s
                if (record.chainType === 'EOS') {
                    let date = new Date(receipt.block_time + 'Z'); // "Z" is a zero time offset
                    newTime = date.getTime()/1000;
                } else {
                    let blockNumber     = receipt.blockNumber;
                    let block           = await ccUtil.getBlockByNumber(blockNumber,chainType);
                    newTime = Number(block.timestamp); // unit s
                }
                record.successTime  = newTime.toString();
                logger.info("waitNormalConfirm update record %s, status %s :", record.txHash, record.status);
                this.updateRecord(record);

                if (record.hasOwnProperty("annotate") && record.annotate == "PrivateRefund") {
                    // This is private refund tx...
                    if (!record.hasOwnProperty('otaTxHash')) {
                        logger.error("Refund private tx missing otaTxHash, record.txHash=", record.txHash);
                        return;
                    }

                    logger.info("Refund private tx, ota txHash: ", record.otaTxHash);

                    let otaTbl = global.wanScanDB.getUsrOTATable();
                    let otaRec = otaTbl.read(record.otaTxHash);
                    if (!otaRec) {
                        logger.error("Refund private tx not found original record, ota=", record.otaTxHash);
                        return;
                    }

                    otaRec.state = "Refund";
                    otaTbl.update(record.otaTxHash, otaRec);
                }
            }
            if (this.receiptFailOrNot(receipt, record) === true){
                record.status       = 'Failed';
                logger.info("waitNormalConfirm update record %s, status %s :", record.txHash,record.status);
                this.updateRecord(record);
            }
        }catch(error){
            if (typeof error === 'string' && error == 'no receipt was found') {
                logger.info("waitNormalConfirm, %s for txHash=%s", error, record.txHash);
            } else {
                logger.error("error waitNormalConfirm, txHash=%s",record.txHash);
                logger.error("error is", error);
            }
        }
    },

    updateRecord(record){
        global.wanDb.updateItem(this.normalCollection,{'txHash':record.txHash},record);
    },

    async monitorTaskNormal(){
        logger.debug("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
        logger.debug("Entering monitor task [Normal Trans.]");
        logger.debug("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
        let records = global.wanDb.filterNotContains(self.config.normalCollection,'status',['Success']);
        logger.debug('handlingList length is ', Object.keys(handlingList).length);
        for(let i=0; i<records.length && !self.done; i++){
            let record = records[i];
            let cur = Date.now();
            if(handlingList[record.hashX]) {
              if(handlingList[record.hashX]+300000 < cur){
                  delete handlingList[record.hashX];
              }else{
                logger.debug('handingList already have this record, hashX is ', record.hashX, handlingList[record.hashX]);
                continue;
              }
            }
            handlingList[record.hashX] = cur;
            logger.debug('handingList add the record, hashX is ', record.hashX, handlingList[record.hashX], record.status);
            self.monitorRecord(record);
        }

        if (!self.done) {
            self.timer = setTimeout(function() {
                self.monitorTaskNormal();
            }, timerInterval);
        }
    },

    async monitorRecord(record){
        //logger.debug(this.name);
        switch(record.status) {
        /// approve begin
        case 'Sent':
        {
          await this.waitNormalConfirm(record);
          break;
        }
        case 'Sending':
        {
          //this.waitNormalConfirm(record);
          break;
        }
        /// revoke   end
        /// default  begin
        default:
          break;
        }
        if( handlingList[record.hashX]) {
            logger.debug("handlingList delete already handled hashX", record.hashX);
            delete handlingList[record.hashX];
        }
    },
}
exports.MonitorRecordNormal = MonitorRecordNormal;
