/**
 * Check OTA
 *
 * Copyright 2019 Wanchain, liscensed under MIT liscense.
 */
'use strict'
const ccUtil = require('../api/ccUtil');
const error  = require('../api/error');
const utils  = require('../util/util');
const web3Util= require('../util/web3util');
const wanUtil= require('wanchain-util');

const WAN_BIP44_ID = 5718350;

let _SCAN_BATCH_SIZE;
let _SCAN_BATCH_MAX;
let _SCAN_BATCH_MIN;
let _SCAN_INTERVAL;
let _SCAN_BOUNDARY;

let logger = utils.getLogger('monitorOTA.js');

let self;
/**
 */
const   MonitorOTA   = {
    init(otaDB){
        this._otaStore = otaDB;
        this._checkAccts = {};

        this.done = false;

        _SCAN_BATCH_SIZE= utils.getConfigSetting("privateTX:scan:batch:size", 1000);
        _SCAN_BATCH_MAX = utils.getConfigSetting("privateTX:scan:batch:max", 10000);
        _SCAN_BATCH_MIN = utils.getConfigSetting("privateTX:scan:batch:min", 100);
        _SCAN_INTERVAL  = utils.getConfigSetting("privateTX:scan:interval", 60000);
        _SCAN_BOUNDARY  = utils.getConfigSetting("privateTX:scan:boundary", 5);

        this._lastOTAinBatch = -1;
        this._lastBatchSize  = _SCAN_BATCH_SIZE;

        //
        // Get 'buyCoinNote' ABI
        this._buyCoinJson = web3Util.getMethodABIDefine('buyCoinNote', wanUtil.coinSCAbi);
        this._buyCoinFnSign = web3Util.signFunction(this._buyCoinJson).slice(0,8);
        logger.debug("buyCoin sign", this._buyCoinFnSign);

        self = this;

        let enabled = utils.getConfigSetting('privateTX:enabled', true);
        let bootstrap = utils.getConfigSetting('privateTX:scan:bootstrap', 10000);

        if (!enabled) {
            logger.warn("WAN OTA disabled!");
            return
        }

        self.timer = setTimeout(function() {
            self.scan();
            }, bootstrap);
    },

    shutdown() {
        this.done = true;
        if (this.timer) {
            clearTimeout(this.timer);
        }
    },

    async startScan(wid, path, password) {
        if (typeof wid !== 'number' || typeof 'path' !== 'string') {
            throw new error.InvalidParameter("Missing wid and/or path")
        }

        if (utils.getChainIDFromBIP44Path(path) !== WAN_BIP44_ID) {
            throw new error.InvalidParameter(`Invalid path: '${path}'`)
        }

        let pathKey = utils.compositeWalletKey(wid, path);
        if (this._checkAccts.hasOwnProperty(pathKey)) {
            logger.warn(`OTA scan for '${wid}:${path}' already started!`);
            return false;
        }

        let chnmgr = global.chainManager;
        if (!chnmgr) {
            throw new error.LogicError("Illogic, chain manager not initialized");
        }

        let chn = chnmgr.getChain('WAN');
        let opt = utils.constructWalletOpt(wid, password);

        let addr = await chn.getAddress(wid, path);
        if (!addr.hasOwnProperty('waddress')) {
            throw new error.InvalidParameter(`Wallet ID '${wid}' not support get private address!`);
        }

        let priv = await chn.getPrivateKey(wid, path, opt);
        if (priv.length < 2) {
            throw new error.RuntimeError("Wallet failed to get private key!");
        }

        // priv[0] is privateKeyA, priv[1] is privateKeyB
        //

        this._checkAccts[pathKey] = {
            "wid" : wid,
            "path": path,
            "waddress": addr.waddress,
            "pubkeyA" : addr.pubKey,
            "privkeyB": priv[1]
        }

        let accTbl = this._otaStore.getAcctTable()
        if (accTbl.read(pathKey)) {
            logger.debug(`OTA scan for '${wid}:${path}' continued...`)
        } else {
            let latestBlock = await ccUtil.getBlockNumber('WAN');
            let rec = {
                "acctID" : pathKey,
                "scaned" : {
                    "begin": latestBlock,
                    "end"  : latestBlock
                }
            }
            accTbl.insert(rec);
        }

        return true;
    },

    async scan() {
        let usrOTA = self._otaStore.getUsrOTATable();
        let accTbl = self._otaStore.getAcctTable();

        let scanBoundary= _SCAN_BOUNDARY;

        try {
            let latestBlock = await ccUtil.getBlockNumber('WAN');

            let scanHardEnd = latestBlock - scanBoundary;

            logger.debug("OTA scan hard end: ", scanHardEnd);

            let highBegin = scanHardEnd;
            let lowEnd = 0;

            let keys = Object.keys(self._checkAccts)
            for (let i=0; i<keys.length; i++) {
                let id = keys[i];

                let record = accTbl.read(id);
                if (!record) {
                    logger.error(`OTA scan for '${id}' not exist!`)
                    continue
                }

                if (record.scaned.begin > lowEnd) {
                    lowEnd = record.scaned.begin
                }

                if (record.scaned.end < highBegin) {
                    highBegin = record.scaned.end
                }
            }

            let scanBatchSize = self._adjustBatchSize();
            self._lastOTAinBatch = 0;

            logger.debug("Scan LowEnd=%d, HighBegin=%d", lowEnd, highBegin);
            if (highBegin < scanHardEnd) {
                let highEnd = highBegin + scanBatchSize < scanHardEnd ? highBegin + scanBatchSize : scanHardEnd;
                self._lastOTAinBatch += await self._scanRange(highBegin, highEnd, keys)
            }

            if (lowEnd > 0) {
                let lowBegin = lowEnd - scanBatchSize > 0 ? lowEnd - scanBatchSize : 0;
                self._lastOTAinBatch += await self._scanRange(lowBegin, lowEnd, keys)
            }
        } catch (err) {
            logger.error("Caught error when scan OTA:", err);
            self._lastOTAinBatch = -1;
        }

        if (!this.done) {
            let interval = self._adjustInterval();

            self.timer = setTimeout(function(){
                             self.scan();
                         }, interval);
        }
    },

    async _scanRange(begin, end, keys) {
        let usrOTA = this._otaStore.getUsrOTATable();
        let accTbl = this._otaStore.getAcctTable();

        logger.debug(`Scan OTA range '[${begin}, ${end})'`)
        let txs = await this._getOTATxInRange(begin, end);

        let count = 0;
        if (txs) {
            count = txs.length;
            logger.info("Total got %d transactions in the range [%d, %d]", count, begin, end);

            for (let i=0; i<txs.length; i++) {
                let tx = txs[i];

                let txFuncSign = tx.input.slice(2, 10);
                let txFuncInput= '0x' + tx.input.slice(10);

                if (txFuncSign != this._buyCoinFnSign) {
                    continue
                }

                let param = web3Util.decodeParameters(this._buyCoinJson.inputs, txFuncInput);
                let otaPub = wanUtil.recoverPubkeyFromWaddress(param.OtaAddr);

                for (let j=0; j<keys.length; j++) {
                    //let accRecord = accTbl.read(keys[j]);
                    //if (!accRecord) {
                    //    logger.error("Check OTA for %s not exist", keys[j]);
                    //    continue
                    //}
                    //// Already scaned
                    //if (accRecord.scaned.begin < begin) {
                    //    continue
                    //}
                    //if (accRecord.scaned.end > end) {
                    //    continue
                    //}

                    if (tx.to != wanUtil.contractCoinAddress) {
                        logger.error("Unreasonable, got invalid tx when scaning OTA");
                        continue
                    }


                    let myKey = this._checkAccts[keys[j]];

                    let A1 = wanUtil.generateA1(Buffer.from(myKey.privkeyB, 'hex'),
                                                Buffer.from(myKey.pubkeyA, 'hex'),
                                                otaPub.B);

                    if (A1.toString('hex') === otaPub.A.toString('hex')) {
                        logger.info("Found OTA tx for address: '%s', value=%s", keys[j], param.Value.toString());
                        try {
                            let myOTA = {
                                 "txhash"   : tx.hash,
                                 "toOTA"    : param.OtaAddr,
                                 "toAcctID" : keys[j],
                                 "value"    : param.Value.toString(),
                                 "from"     : tx.from,
                                 "blockNo"  : tx.blockNumber,
                                 "state"    : "Found",
                            }
                            usrOTA.insert(myOTA);
                        } catch (err) {
                            if (err instanceof error.DuplicateRecord) {
                                logger.warn("OTA tx already exist! txhash=%s", tx.hash);
                            } else {
                                throw err
                            }

                        }
                        break;
                    }

                }
            }

        }
        // update scan info
        for (let i=0; i<keys.length; i++) {
            logger.debug("Update scan:", keys[i])
            let prev = accTbl.read(keys[i]);
            if (!prev) {
                logger.error("Check OTA for %s not exist", keys[j]);
                continue
            }

            let up = {
                "acctID" : keys[i],
                "scaned" : {
                    "begin" : begin < prev.scaned.begin ? begin : prev.scaned.begin,
                    "end" : end > prev.scaned.end ? end : prev.scaned.end
                }
            }
            accTbl.update(keys[i], up);

        }

        return count;

    },

    _adjustBatchSize() {
        let batchSize = this._lastBatchSize;
        let lastCount = this._lastOTAinBatch;

        if (lastCount < 0) {
            batchSize =  batchSize < _SCAN_BATCH_SIZE ? batchSize : _SCAN_BATCH_SIZE;
        } else if (lastCount < 10) {
            batchSize += _SCAN_BATCH_SIZE;
        } else if (lastCount > 20) {
            batchSize /= 2;
        }

        batchSize = Math.floor(batchSize)

        if (batchSize > _SCAN_BATCH_MAX) {
            batchSize = _SCAN_BATCH_MAX
        }

        if (batchSize < _SCAN_BATCH_MIN) {
            batchSize = _SCAN_BATCH_MIN
        }

        this._lastBatchSize = batchSize;

        logger.debug("New batch size: ", batchSize);

        return batchSize;
    },

    _adjustInterval() {
        let interval = _SCAN_INTERVAL;
        let lastCount = this._lastOTAinBatch;

        if (lastCount < 0) {
            return interval;
        }

        if (lastCount < 10) {
            interval /= 2;
        }

        if (lastCount > 50) {
            interval += _SCAN_INTERVAL;
        }

        return interval;
    },

    async _getOTATxInRange(bgn, end) {
        let otaTbl = this._otaStore.getOTATable();
        let accTbl = this._otaStore.getAcctTable();

        let txs = await ccUtil.getTransByAddressBetweenBlocks('WAN', wanUtil.contractCoinAddress, bgn, end);

        return txs
    }
}
exports.MonitorOTA = MonitorOTA;
