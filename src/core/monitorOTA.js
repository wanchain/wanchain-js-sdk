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
let _DO_PRE_FETCH;
let _FETCH_INTERVAL;
let _FETCH_API;
let _FETCH_SIZE_INC_TRIGGER;
let _FETCH_SIZE_DEC_TRIGGER;

let _MY_ACCT = "wallet@Wanchain.org";

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

        _DO_PRE_FETCH   = utils.getConfigSetting('privateTX:scan:algo:preFetch', true);
        _FETCH_INTERVAL = utils.getConfigSetting("privateTX:scan:algo:fetchInterval", 30000);
        _FETCH_API  = utils.getConfigSetting("privateTX:scan:algo:fetchAPI", "getTransByBlock");
        _FETCH_SIZE_INC_TRIGGER = utils.getConfigSetting("privateTX:scan:algo:batchAdjust:increase", 500);
        _FETCH_SIZE_DEC_TRIGGER = utils.getConfigSetting("privateTX:scan:algo:batchAdjust:decrease", 10000);

        this._lastOTAinBatch = -1;
        this._lastBatchSize  = _SCAN_BATCH_SIZE;

        this._lastFetchTime = -1;
        this._lastFetchSize = _SCAN_BATCH_SIZE;

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

        if (_DO_PRE_FETCH) {
            self.preFetchTimer = setTimeout(
                function() {
                    self.fetchTransaction();
                }, bootstrap);
        }
    },

    shutdown() {
        this.done = true;
        if (this.timer) {
            clearTimeout(this.timer);
        }

        if (this.preFetchTimer) {
            clearTimeout(this.preFetchTimer);
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
                "scanned" : {
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

                if (record.scanned.begin > lowEnd) {
                    lowEnd = record.scanned.begin
                }

                if (record.scanned.end < highBegin) {
                    highBegin = record.scanned.end
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
            logger.debug("Total got %d transactions in the range [%d, %d]", count, begin, end);

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
                    //// Already scanned
                    //if (accRecord.scanned.begin < begin) {
                    //    continue
                    //}
                    //if (accRecord.scanned.end > end) {
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
                "scanned" : {
                    "begin" : begin < prev.scanned.begin ? begin : prev.scanned.begin,
                    "end" : end > prev.scanned.end ? end : prev.scanned.end
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

        let myacct = Buffer.from(_MY_ACCT).toString('base64');
        let r = accTbl.read(myacct);

        let txs;
        if (!r || bgn < r.scanned.begin || end > r.scanned.end) {
            txs = await ccUtil.getTransByAddressBetweenBlocks('WAN', wanUtil.contractCoinAddress, bgn, end);
        } else {
            let f = function(t) {
                if (t.blockNumber && t.blockNumber>=bgn && t.blockNumber <= end) {
                    return true;
                }
                return false;
            }

            txs = otaTbl.filter(f)
        }

        return txs
    },

    async preFetch() {
        let accTbl = this._otaStore.getAcctTable();

        let myacct = Buffer.from(_MY_ACCT).toString('base64');

        let latestBlock = await ccUtil.getBlockNumber('WAN');

        let bgn, end;
        let r = accTbl.read(myacct);
        if (!r) {
            r = {
                "acctID" : myacct,
                "scanned" : {
                    "begin": latestBlock,
                    "end"  : latestBlock
                }
            }
            accTbl.insert(r);
        }

        this._checkAccts[myacct] = {
            "wid" : 0,
            "path": _MY_ACCT
        }

    },

    async fetchTransaction() {
        let otaTbl = this._otaStore.getOTATable();
        let accTbl = this._otaStore.getAcctTable();

        let myacct = Buffer.from(_MY_ACCT).toString('base64');

        let latestBlock = await ccUtil.getBlockNumber('WAN');

        let bgn, end;
        let r = accTbl.read(myacct);
        if (!r) {
            r = {
                "acctID" : myacct,
                "scanned" : {
                    "begin": latestBlock,
                    "end"  : latestBlock
                }
            }
            accTbl.insert(r);
        }

        let fetchSize = self._adjustPreFetchSize();
        let hardend = latestBlock - _SCAN_BOUNDARY;
        bgn = r.scanned.begin - fetchSize < 0 ? 0 : r.scanned.begin  - fetchSize;
        end = r.scanned.end + fetchSize < hardend ? r.scanned.end + fetchSize : hardend;

        try {
            if (r.scanned.end < end) {
                await this._doFetch(r.scanned.end, end);
                r.scanned.end = end;
            }

            if (bgn < r.scanned.begin) {
                await this._doFetch(bgn, r.scanned.begin)
                r.scanned.begin = bgn;
            }

            accTbl.update(myacct, r);

        } catch(err) {
            logger.error("Caught error when fetching block: ", err)
        }

        if (!this.done) {
            self.preFetchTimer = setTimeout(
                function() {
                    self.fetchTransaction();
                }, _FETCH_INTERVAL);
        }
    },

    async _doFetch(bgn, end) {
        let otaTbl = this._otaStore.getOTATable();

        logger.debug("Do fetch tx in range [%d, %d]", bgn, end)
        let getTxByBlock = async function(bgn, end) {
            let promiseArray = [];
            for (let i=bgn; i<=end; i++) {
                promiseArray.push(ccUtil.getTransByBlock('WAN', i));
            }

            let timeout = utils.getConfigSetting("network:timeout", 300000);
            let ret = await utils.promiseTimeout(timeout, Promise.all(promiseArray), 'Get tx timed out!');

            let txs=[];
            for (let i=0; i < ret.length; i++) {
                if (!ret[i]) {
                    continue
                }
                for (let j=0; j < ret[i].length; j++) {
                    txs.push(ret[i][j]);
               }

            }

            return txs;
        };

        let getTxByAddr = async function(bgn, end) {
            return await ccUtil.getTransByAddressBetweenBlocks('WAN', wanUtil.contractCoinAddress, bgn, end);
        };

        let getTx = {
            "getTransByBlock" : getTxByBlock,
            "getTransByAddressBetweenBlocks" : getTxByAddr
        };

        let fn = getTx[_FETCH_API];
        if (typeof fn === 'undefined') {
            fn = getTxByAddr;
        }

        try {
            let t1 = Date.now();
            let txs = await fn(bgn, end);
            let t2 = Date.now();

            this._lastFetchTime = t2 - t1;

            if (!txs) {
                return;
            }
            for (let i=0; i<txs.length; i++) {
                let tx = txs[i];
                if (tx.to != wanUtil.contractCoinAddress) {
                    return
                }

                let txFuncSign = tx.input.slice(2, 10);
                let txFuncInput= '0x' + tx.input.slice(10);

                if (txFuncSign != self._buyCoinFnSign) {
                    return
                }

                logger.debug("Found transaction in block:", tx.blockNumber);

                let ota = {
                    "blockNumber" : tx.blockNumber,
                    "hash" : tx.hash,
                    "from" : tx.from,
                    "to"   : tx.to,
                    "input": tx.input
                }

                otaTbl.insert(ota);
            }
        } catch(err) {
            if (err instanceof error.DuplicateRecord) {
                logger.debug("Fetch ota tx already exist! txhash=%s", tx.hash);
            } else {
                this._lastFetchTime = -1;
                throw err
            }
        }

    },

    _adjustPreFetchSize() {
        let batchSize = this._lastFetchSize;
        let lastTiming= this._lastFetchTime; // timing in ms

        if (_FETCH_API == "getTransByBlock") {
            return _SCAN_BATCH_MIN;
        }

        if (lastTiming < 0) {
            batchSize =  batchSize < _SCAN_BATCH_SIZE ? batchSize : _SCAN_BATCH_SIZE;
        } else if (lastTiming < _FETCH_SIZE_INC_TRIGGER) {
            batchSize += _SCAN_BATCH_SIZE;
        } else if (lastTiming > _FETCH_SIZE_DEC_TRIGGER) {
            batchSize /= 2;
        }

        batchSize = Math.floor(batchSize)

        if (batchSize > _SCAN_BATCH_MAX) {
            batchSize = _SCAN_BATCH_MAX
        }

        if (batchSize < _SCAN_BATCH_MIN) {
            batchSize = _SCAN_BATCH_MIN
        }

        this._lastFetchSize = batchSize;

        return batchSize;
    }


}
exports.MonitorOTA = MonitorOTA;
