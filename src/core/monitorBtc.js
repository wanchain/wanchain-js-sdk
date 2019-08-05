'use strict';

const ccUtil     = require('../api/ccUtil');
const btcUtil    = require('../api/btcUtil');
const utils      = require('../util/util');

let  Logger      = require('../logger/logger');

let  mrLoggerBtc;
let  confirmBlocks;    // For WAN block confirm
let  btcConfirmBlocks; // For BTC block confirm

let handlingList = {};

let self;
let timerStart   = 17000;
let timerInterval= 17000;

const MonitorRecordBtc = {
    async init(config){
        this.config = config;
        this.crossCollection  = config.crossCollectionBtc;
        this.name             = "monitorBTC";
        this.done  = false;

        self = this;

        btcConfirmBlocks = config.btcConfirmBlocks;
        confirmBlocks    = config.confirmBlocks;

        mrLoggerBtc           = utils.getLogger('monitorBtc.js');

        //backendConfig.ethGroupAddr = config.originalChainHtlc;
        //backendConfig.wethGroupAddr = config.wanchainHtlcAddr;
        handlingList = {};

        self.timer = setTimeout(function() {
            self.monitorTaskBtc();
        }, timerStart);
    },

    shutdown() {
        this.done = true;
        if (this.timer) {
            clearTimeout(this.timer);
        }
    },

    monitorTaskBtc(){
        mrLoggerBtc.debug("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
        mrLoggerBtc.debug("Entering monitor task [BTC Trans.]");
        mrLoggerBtc.debug("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
        let history = global.wanDb.filterNotContains(this.crossCollection ,'status',['redeemFinished','revokeFinished','sentHashFailed']);

        let self = this;
        mrLoggerBtc.debug('handlingList length is ', Object.keys(handlingList).length);
        for (let i=0; i<history.length && !self.done; i++){
            let record = history[i];
            let cur = Date.now();
            if (handlingList[record.hashX]) {
                if(handlingList[record.hashX]+300000 < cur){
                    delete handlingList[record.hashX];
                }else{
                    continue;
                }
            }
            handlingList[record.hashX] = cur;
            try{
                self.monitorRecord(record);
            }catch(error){
                mrLoggerBtc.error("monitorRecord error:", error);
            }
        }

        if (!self.done) {
            self.timer = setTimeout(function() {
                self.monitorTaskBtc();
            }, timerInterval);
        }
    },

    async checkXOnlineBtc(record){
        try {
            let redeemTxHash = record.btcRefundTxHash;
            let btcTx = await ccUtil.getBtcTransaction(redeemTxHash);
            mrLoggerBtc.debug("checkXOnline: ", btcTx);
            if(btcTx && btcTx.confirmations && btcTx.confirmations>0) {
                record.status = 'sentXConfirming';
                this.updateRecord(record);
            }
        }catch(err){
            mrLoggerBtc.error("checkTxOnline:", err);
        }
    },
    async checkRevokeOnlineBtc(record){
        try {
            let btcTx = await ccUtil.getBtcTransaction(record.btcRevokeTxHash);
            mrLoggerBtc.debug("checkRevokeOnline: ", btcTx);
            if(btcTx && btcTx.confirmations && btcTx.confirmations>=1){
                record.status = 'sentRevokeConfirming';
                this.updateRecord(record );
            }
        }catch(err){
            //console.log("checkRevokeOnline:", err);
        }
    },
    async checkHashConfirmWan(record){
        try {
	        let txhash = '0x'+record.lockTxHash;
            let waitBlock = record.lockConfirmed < confirmBlocks ? record.lockConfirmed: confirmBlocks;
            //let receipt = await this.monitorTxConfirm(sender, txhash, waitBlock);
            let receipt = await ccUtil.waitConfirm(txhash, waitBlock, 'WAN');
            mrLoggerBtc.debug("checkHashConfirmWan: ", receipt);
            if(receipt){
                record.lockConfirmed += 1;
                if(record.lockConfirmed >= confirmBlocks){
                    record.status = 'waitingCross';
                }
                this.updateRecord(record);
            }
        }catch(err){
            //console.log("checkHashConfirm:", err);
        }
    },
    async checkXOnlineWan(record){
        try {
            let txhash = '0x'+record.refundTxHash;
            //let receipt = await this.monitorTxConfirm(sender, txhash, 0);
            let receipt = await ccUtil.waitConfirm(txhash, 0, 'WAN');
            mrLoggerBtc.debug("checkRedeemConfirmWan: ", receipt);
            if(receipt){
                if(receipt.status === '0x1'){
                    record.status = 'sentXConfirming';
                }else{
                    record.status = 'sentRedeemFailed';
                }
                this.updateRecord(record);
            }
        }catch(err){
            //console.log("checkHashConfirm:", err);
        }
    },
    async checkRevokeOnlineWan(record){
        try {
            let txhash = '0x'+record.revokeTxHash;
            //let receipt = await this.monitorTxConfirm(sender, txhash, 0);
            let receipt = await ccUtil.waitConfirm(txhash, 0, 'WAN');
            mrLoggerBtc.debug("checkRevokeConfirmWan: ", receipt);
            if(receipt){
                if(receipt.status === '0x1'){
                    record.status = 'sentRevokeConfirming';
                }else{
                    record.status = 'sentRevokeFailed';
                }
                this.updateRecord(record);
            }
        }catch(err){
            //console.log("checkHashConfirm:", err);
        }
    },
    async checkHashConfirmBtc(record){
        try {
            let txhash = record.btcLockTxHash;
            let btcTx = await ccUtil.getBtcTransaction(txhash);
            mrLoggerBtc.debug("checkHashConfirmBtc btcTx: ", btcTx);
            if(btcTx && btcTx.confirmations && btcTx.confirmations >= btcConfirmBlocks){
                record.status = 'waitingCross';
                this.updateRecord(record );
            }
        }catch(err){
            mrLoggerBtc.debug("checkHashConfirmBtc:", err);
        }
    },
    async checkHashReceiptOnlineWan(record){
        try {
            let txhash = '0x'+record.lockTxHash;
            //let receipt = await this.monitorTxConfirm(sender, txhash, 0);
            let receipt = await ccUtil.waitConfirm(txhash, 0, 'WAN');
            if(receipt){
                if(receipt.status === '0x1'){
                    // update the time to block time.
                    let block = await ccUtil.getBlockByNumber(receipt.blockNumber, 'WAN');
                    let newtime = Number(block.timestamp)*1000;
                    record.time = newtime.toString();
                    record.suspendTime = (1000*Number(global.lockedTimeBTC)+newtime).toString();
                    record.HTLCtime = (2*60*60*1000+2*1000*Number(global.lockedTimeBTC)+newtime).toString();// extra 2 hours, because btc locktime need more than 5 blocks.
                    record.status = 'sentHashConfirming';
                }else{
                    record.status = 'sentHashFailed';
                }
                this.updateRecord(record);
            }
        }catch(err){
            //console.log("checkHashReceiptOnline:", err);
        }
    },
    async checkHashReceiptOnlineBtc(record){
        try {
            let txhash = record.btcLockTxHash;
            let btcTx = await ccUtil.getBtcTransaction(txhash);
            mrLoggerBtc.debug("checkHashReceiptOnlineBtc btcTx: ", btcTx);
            if(btcTx){
                record.status = 'sentHashConfirming';
                this.updateRecord(record);
            }
        }catch(err){
            mrLoggerBtc.debug("checkHashReceiptOnlineBtc:", err);
        }
    },
    async checkXConfirm(record){
        try {
            if(record.chain === "BTC"){
                let waitBlock = record.refundConfirmed < confirmBlocks ? record.refundConfirmed: confirmBlocks;
                //let receipt = await this.monitorTxConfirm(sender, '0x'+record.refundTxHash, waitBlock);
                let receipt = await ccUtil.waitConfirm('0x'+record.refundTxHash, waitBlock, 'WAN');
                if(receipt){
                    record.refundConfirmed += 1;
                    if(record.refundConfirmed >= confirmBlocks){
                        record.status = 'redeemFinished';
                    }
                    this.updateRecord(record);
                }

            }else{
                let redeemTxHash = record.btcRefundTxHash;
                let btcTx = await ccUtil.getBtcTransaction(redeemTxHash);
                mrLoggerBtc.debug("checkXOnline: ", btcTx);
                if(btcTx && btcTx.confirmations && btcTx.confirmations >= btcConfirmBlocks){
                    record.status = 'redeemFinished';
                    this.updateRecord(record );
                }
            }

        }catch(err){
            mrLoggerBtc.error("checkXConfirm:", err);
        }
    },


    async checkRevokeConfirm(record){
        try {
            if(record.chain === "BTC"){
                let btcTx = await ccUtil.getBtcTransaction(record.btcRevokeTxHash);
                mrLoggerBtc.debug("checkRevokeConfirm: ", btcTx);
                if(btcTx && btcTx.confirmations && btcTx.confirmations >= btcConfirmBlocks){
                    record.status = 'revokeFinished';
                    this.updateRecord(record );
                }
            }else{
                let waitBlock = record.revokeConfirmed < confirmBlocks ? record.revokeConfirmed: confirmBlocks;
                //let receipt = await this.monitorTxConfirm(sender, '0x'+record.revokeTxHash, waitBlock);
                let receipt = await ccUtil.waitConfirm('0x'+record.revokeTxHash, waitBlock, 'WAN');
                if(receipt){
                    record.revokeConfirmed += 1;
                    if(record.revokeConfirmed >= confirmBlocks){
                        record.status = 'revokeFinished';
                    }
                    this.updateRecord(record);
                }
            }
        }catch(err){
            mrLoggerBtc.error("checkRevokeConfirm:", err);
        }
    },
    async checkCrossHashConfirmDeposit(record){
        try {
            let waitBlock = record.crossConfirmed < confirmBlocks ? record.crossConfirmed: confirmBlocks;
            //let receipt = await this.monitorTxConfirm(sender, record.crossLockHash, waitBlock);
            let receipt = await ccUtil.waitConfirm(record.crossLockHash, waitBlock, 'WAN');
            mrLoggerBtc.debug("checkCrossHashConfirmDeposit receipt: ", receipt);
            if(receipt){
                if(!record.crossConfirmed) record.crossConfirmed = 0;
                record.crossConfirmed += 1;
                if(record.crossConfirmed >= confirmBlocks){
                    record.status = 'waitingX';
                    this.updateRecord(record);
                }
            }
        }catch(err){
            mrLoggerBtc.error("checkCrossHashConfirmDeposit:", err);
        }
    },
    async checkCrossHashConfirmWithdraw(record){
        try {
            let btcTx = await ccUtil.getBtcTransaction(record.btcLockTxHash);
            mrLoggerBtc.debug("checkCrossHashConfirmWithdraw btcTx:", btcTx);
            if(btcTx && btcTx.confirmations && btcTx.confirmations >= btcConfirmBlocks){
                record.status = 'waitingX';
                this.updateRecord(record );
            }
        }catch(err){
            mrLoggerBtc.error("checkCrossHashConfirm:", err);
        }
    },

    async checkHashTimeout( record){
        if(record.status === "sentHashFailed") {
            return false;
        }
        if(record.status === "waitingRevoke"
            || record.status ==="sentRevokePending"
            || record.status ==="sentRevokeFailed"
            || record.status ==="sentRevokeConfirming"){
            return true;
        }
        try {
            let HTLCtime = Number(record.HTLCtime);
            let suspendTime = Number(record.suspendTime);
            if(HTLCtime <= Date.now()){
                record.status = 'waitingRevoke';
                this.updateRecord(record);
                return true;
            }else if(suspendTime <= Date.now()){
                record.status = 'suspending';
                this.updateRecord(record);
                return true;
            }
        }catch(err){
            mrLoggerBtc.error("checkHashTimeout:", err);
        }
        return false;
    },

    async checkCrossHashOnline(record){
        try {
            let receipt;
            if (record.chain==="BTC") {
                receipt = await ccUtil.getDepositCrossLockEvent('0x'+record.hashX, ccUtil.encodeTopic("address", '0x'+record.crossAddress), 'WAN');
                mrLoggerBtc.debug("checkCrossHashOnline deposit: ", JSON.stringify(receipt, null, 4));
                if(receipt && receipt.length>0){
                    record.crossConfirmed = 1;
                    record.crossLockHash = receipt[0].transactionHash;// the storeman notice hash.
                    let value = utils.toBigNumber(receipt[0].data).toString(10);
                    if(value == record.value){
                        record.status = 'waitingCrossConfirming';
                        mrLoggerBtc.debug("checkCrossHashOnline record:", record);
                        this.updateRecord(record);
                    } else {
                        mrLoggerBtc.debug("invalid value of cross transaction: ", record, receipt);
                    }
                }
            } else {
                // in btc record, crossAddress has no 0x, but wan record has 0x
                receipt = await ccUtil.getBtcWithdrawStoremanNoticeEvent('0x'+record.hashX, ccUtil.encodeTopic("address", record.crossAddress), 'WAN');
                mrLoggerBtc.debug("checkCrossHashOnline WAN:", receipt);
                if(receipt && receipt.length>0){
                    let btcLockTxHash = receipt[0].data.slice(2,66);
                    let redeemLockTimeStamp = Number('0x'+receipt[0].data.slice(66));
                    let StoremanBtcH160 = receipt[0].topics[1].slice(26);
                    let btcTx = await ccUtil.getBtcTransaction(btcLockTxHash);
                    mrLoggerBtc.debug("checkCrossHashOnline btcTx:", btcTx);
                    let contract = btcUtil.hashtimelockcontract(record.hashX, redeemLockTimeStamp, record.crossAddress, StoremanBtcH160)

                    if(btcTx && btcTx.confirmations && btcTx.locktime===0) {
                        let  btcTx_value = Number(utils.toBigNumber(btcTx.vout[0].value).mul(100000000));
                        let  btcTx_p2sh = btcTx.vout[0].scriptPubKey.addresses[0];
                        if(btcTx_value === Number(record.value) && btcTx_p2sh ===contract.p2sh){
                            record.crossConfirmed = 1;
                            record.crossLockHash = receipt[0].transactionHash;// the storeman notice hash.
                            record.StoremanBtcH160 = StoremanBtcH160;
                            record.btcRedeemLockTimeStamp = redeemLockTimeStamp*1000;
                            record.btcLockTxHash = btcLockTxHash;
                            record.status = 'waitingCrossConfirming';
                            mrLoggerBtc.debug("checkCrossHashOnline record:", record);
                            this.updateRecord(record);
                        } else {
                            mrLoggerBtc.error("checkCrossHashOnline invalid value: ",btcTx_value, record.value)
                        }
                    }
                }
            }
        }catch(err){
            mrLoggerBtc.error("checkCrossHashOnline:", err.message||err);
        }
    },

    updateRecord(record){
        // Warning: hashX is unique!!!
        global.wanDb.updateItem(this.crossCollection,{'hashX':record.hashX},record);
    },

    async monitorRecord(record){
        if(this.checkHashTimeout(record) == true){
            mrLoggerBtc.debug("tx timeout: ", record);
        }
        //mrLoggerBtc.debug("record status is ", record.status);
        switch(record.status) {
            case 'sentHashPending':
                if(record.chain === 'BTC') {
                    await this.checkHashReceiptOnlineBtc(record);
                } else {
                    await this.checkHashReceiptOnlineWan(record);
                }
                break;
            case 'sentHashConfirming':
                if(record.chain === 'BTC') {
                    await this.checkHashConfirmBtc(record);
                } else {
                    await this.checkHashConfirmWan(record);
                }
                break;
            case 'waitingCross':
                await this.checkCrossHashOnline(record);
                break;
            case 'waitingCrossConfirming':
                if(record.refundTxHash){
                    record.status = 'sentXPending';
                    this.updateRecord(record);
                    break;
                }
                if(record.chain === 'BTC') {
                    await this.checkCrossHashConfirmDeposit(record);
                } else {
                    await this.checkCrossHashConfirmWithdraw(record);
                }
                break;
            case 'waitingX':
                // if(record.chain === "BTC"){
                //     if(record.refundTxHash){
                //         record.status = 'sentXPending';
                //         this.updateRecord(record);
                //     }
                // }else {
                //     if(record.btcRefundTxHash){
                //         record.status = 'sentXPending';
                //         this.updateRecord(record);
                //     }
                // }
                break;
            case 'suspending':
                // do nothing.
                break;
            case 'sentRevokeFailed':
                break;
            case 'sentRedeemFailed':
                break;
            case 'waitingRevoke':
                // let txhash;
                // if(record.chain === "BTC"){
                //     txhash = record.btcRevokeTxHash;
                // }else {
                //     txhash = record.revokeTxHash;
                // }
                // if(txhash){
                //     record.status = 'sentRevokePending';
                //     this.updateRecord(record);
                // }
                break;
            case 'sentRevokePending':
                if(record.chain === 'BTC') {
                    await this.checkRevokeOnlineBtc(record);
                } else {
                    await this.checkRevokeOnlineWan(record);
                }
                break;
            case 'sentRevokeConfirming':
                await this.checkRevokeConfirm(record);
                break;

            case 'sentXPending':
                if(record.chain === 'BTC') {
                    await this.checkXOnlineWan(record);
                } else {
                    await this.checkXOnlineBtc(record);
                }
                break;
            case 'sentXConfirming':
                await this.checkXConfirm(record);
                break;

            case 'redeemFinished':
            case 'revokeFinished':
                break;
            default:
                break;
        }
        if( handlingList[record.hashX]) {
            delete handlingList[record.hashX];
        }
    },
};


exports.MonitorRecordBtc = MonitorRecordBtc;
