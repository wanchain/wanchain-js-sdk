'use strict'
const ccUtil    = require('../api/ccUtil');
const BigNumber = require('bignumber.js');
const utils     = require('../util/util');
let  logger;

let self;

let timerStart   = 11000;
let timerInterval= 11000;
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

        logger = utils.getLogger("monitorNormal.js");

        self.timer = setTimeout(function() {
            self.monitorTaskNormal();
        }, timerStart);
    },

    shutdown() {
        this.done = true

        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    },

    receiptFailOrNot(receipt){
        if(receipt && receipt.status !== '0x1'){
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
            logger.debug("record = %s",record);
            logger.debug("Entering waitNormalConfirm, txHash = %s",record.txHash);
            let receipt = await ccUtil.waitConfirm(record.txHash, this.config.confirmBlocks, record.chainType);
            logger.debug("%%%%%%%%%%%%%%%%%%%%%%%response from waitNormalConfirm%%%%%%%%%%%%%%%%%%%%%");
            logger.debug("response from waitNormalConfirm, txHash = %s",record.txHash);

            logger.debug("receipt: %s", JSON.stringify(receipt, null, 4));
            if(receipt && receipt.hasOwnProperty('blockNumber') && receipt.status === '0x1'){
                record.status       = 'Success';
                let blockNumber     = receipt.blockNumber;
                let chainType       = record.chainType;
                let block           = await ccUtil.getBlockByNumber(blockNumber,chainType);
                let newTime         = Number(block.timestamp); // unit s
                record.successTime  = newTime.toString();
                logger.info("waitNormalConfirm update record %s, status %s :", record.txHash, record.status);
                this.updateRecord(record);

                if (record.hasOwnProperty("annotate") && record.annotate == "PrivateRefund") {
                    // This is private refund tx...
                    if (!record.hasOwnProperty('otaTxHash')) {
                        logger.error("Refund private tx missing otaTxHash, record.txHash=", record.txHash);
                        return;
                    }

                    logger.info("Refund privte tx, ota txhash: ", record.otaTxHash);

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
            if (this.receiptFailOrNot(receipt) === true){
                record.status       = 'Failed';
                logger.info("waitNormalConfirm update record %s, status %s :", record.txHash,record.status);
                this.updateRecord(record);
            }
        }catch(error){
            if (typeof error === 'string' && error == 'no receipt was found') {
                logger.info("waitNormalConfirm, %s for txHash=%s", error, record.txHash);
            } else {
                logger.error("error waitNormalConfirm, txHash=%s",record.txHash);
                logger.error(error);
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

        for(let i=0; i<records.length && !self.done; i++){
            let record = records[i];
            await self.monitorRecord(record);
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
          this.waitNormalConfirm(record);
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
    },
}
exports.MonitorRecordNormal = MonitorRecordNormal;
