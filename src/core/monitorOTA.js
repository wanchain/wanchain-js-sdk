/**
 * Check OTA
 *
 * Copyright 2019 Wanchain, liscensed under MIT liscense.
 */
'use strict'
const ccUtil = require('../api/ccUtil');
const hdUtil = require('../api/hdUtil');
const error = require('../api/error');
const utils = require('../util/util');
const web3Util = require('../util/web3util');
const wanUtil = require('wanchain-util');

const WAN_BIP44_ID = 5718350;

let _SCAN_BATCH_SIZE;
let _SCAN_BATCH_MAX;
let _SCAN_BATCH_MIN;
let _SCAN_INTERVAL;
let _SCAN_BOUNDARY;
let _DO_PRE_FETCH;
let _FETCH_INTERVAL;
let _MIN_FETCH_INTERVAL;
let _FETCH_API;
let _FETCH_SIZE_INC_TRIGGER;
let _FETCH_SIZE_DEC_TRIGGER;
let _FETCH_FINISHED_CONDITION = 10;
let _HANDLE_OTA_ONE_TIME;

let _MY_ACCT = "wallet@Wanchain.org";

let logger = utils.getLogger('monitorOTA.js');

let self;
/**
 */
const MonitorOTA = {
    init(otaDB) {
        this._otaStore = otaDB;
        this._checkAccts = {};

        this.done = false;

        _SCAN_BATCH_SIZE = utils.getConfigSetting("privateTX:scan:batch:size", 1000);
        _SCAN_BATCH_MAX = utils.getConfigSetting("privateTX:scan:batch:max", 10000);
        _SCAN_BATCH_MIN = utils.getConfigSetting("privateTX:scan:batch:min", 100);
        _SCAN_INTERVAL = utils.getConfigSetting("privateTX:scan:interval", 60000);
        _SCAN_BOUNDARY = utils.getConfigSetting("privateTX:scan:boundary", 5);

        _DO_PRE_FETCH = utils.getConfigSetting('privateTX:scan:algo:preFetch', true);
        _FETCH_INTERVAL = utils.getConfigSetting("privateTX:scan:algo:fetchInterval", 30000);
        _MIN_FETCH_INTERVAL = utils.getConfigSetting("privateTX:scan:algo:minFetchInterval", 5000);
        _FETCH_API = utils.getConfigSetting("privateTX:scan:algo:fetchAPI", "getTransByBlock");
        _FETCH_SIZE_INC_TRIGGER = utils.getConfigSetting("privateTX:scan:algo:batchAdjust:increase", 500);
        _FETCH_SIZE_DEC_TRIGGER = utils.getConfigSetting("privateTX:scan:algo:batchAdjust:decrease", 10000);
        _HANDLE_OTA_ONE_TIME = utils.getConfigSetting("privateTX:scan:handleOtaOneTime", 80);

        this._lastOTAinBatch = -1;
        this._lastBatchSize = _SCAN_BATCH_SIZE;

        this._lastFetchTime = -1;
        this._lastFetchSize = _SCAN_BATCH_SIZE;

        this._fetchInterval = _MIN_FETCH_INTERVAL;

        //
        // Get 'buyCoinNote' ABI
        this._buyCoinJson = web3Util.getMethodABIDefine('buyCoinNote', wanUtil.coinSCAbi);
        this._buyCoinFnSign = web3Util.signFunction(this._buyCoinJson).slice(0, 8);
        logger.debug("buyCoin sign", this._buyCoinFnSign);

        self = this;

        let enabled = utils.getConfigSetting('privateTX:enabled', true);
        let bootstrap = utils.getConfigSetting('privateTX:scan:bootstrap', 10000);

        if (!enabled) {
            logger.warn("WAN OTA disabled!");
            return
        }
        if (_DO_PRE_FETCH) {
            logger.info('start fetch timer', bootstrap)
            self.preFetchTimer = setTimeout(
                function () {
                    self.fetchTransaction();
                }, bootstrap);
        }

        logger.info('start scan timer', bootstrap)
        self.timer = setTimeout(function () {
            self.scan();
        }, bootstrap * 3);
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

        let chnMgr = global.chainManager;
        if (!chnMgr) {
            throw new error.LogicError("Illogic, chain manager not initialized");
        }

        let chn = chnMgr.getChain('WAN');
        let opt = utils.constructWalletOpt(wid, password);

        let addr = await chn.getAddress(wid, path);
        if (!addr.hasOwnProperty('waddress')) {
            throw new error.InvalidParameter(`Wallet ID '${wid}' not support get private address!`);
        }

        if (!addr.hasOwnProperty('pubKey')) {
            let wallet = hdUtil.getWallet(wid);
            if (!wallet.isSupportGetPublicKey()) {
                throw new error.InvalidParameter(`Wallet ID '${wid}' not support get public key!`);
            }
            let pubKey = await wallet.getPublicKey(path, opt);
            addr.pubKey = pubKey;
        }

        let priv = await chn.getPrivateKeys(wid, path, opt);
        if (priv.length < 2) {
            throw new error.RuntimeError("Wallet failed to get private key!");
        }

        let accTbl = this._otaStore.getAcctTable()
        if (accTbl.read(pathKey)) {
            logger.debug(`OTA scan for '${wid}:${path}' continued...`)
        } else {
            let latestBlock = await ccUtil.getBlockNumber('WAN');
            let rec = {
                "acctID": pathKey,
                "scanned": {
                    "begin": latestBlock,
                    "end": latestBlock
                }
            }
            accTbl.insert(rec);
        }

        // priv[0] is privateKeyA, priv[1] is privateKeyB
        this._checkAccts[pathKey] = {
            "wid": wid,
            "path": path,
            "waddress": addr.waddress,
            "pubKeyA": addr.pubKey,
            "privKeyA": priv[0],
            "privKeyB": priv[1]
        }

        return true;
    },

    async scan() {
        let accTbl = self._otaStore.getAcctTable();

        let scanBoundary = _SCAN_BOUNDARY;

        try {
            let latestBlock = await ccUtil.getBlockNumber('WAN');
            let scanHardEnd = latestBlock - scanBoundary;

            logger.debug("OTA scan hard end: ", scanHardEnd);

            let highBegin = scanHardEnd;
            let lowEnd = 0;

            let keys = Object.keys(self._checkAccts)
            for (let i = 0; i < keys.length; i++) {
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

            self.timer = setTimeout(function () {
                self.scan();
            }, interval);
        }
    },

    async _scanRange(begin, end, keys) {
        let usrOTA = this._otaStore.getUsrOTATable();
        let accTbl = this._otaStore.getAcctTable();

        logger.debug(`Scan OTA range '[${begin}, ${end}), length: ${end - begin}'`)
        let txs = await this._getOTATxInRange(begin, end);

        let count = 0;
        if (txs) {
            count = txs.length;
            logger.debug("Total got %d transactions in the range [%d, %d]", count, begin, end);

            for (let i = 0; i < txs.length; i++) {
                /** Release CPU after handle a batch of OTA in case of application is busy */
                if ((i !== 0) && (i % _HANDLE_OTA_ONE_TIME === 0)) {
                    await this.sleep(500);
                }

                let tx = txs[i];

                let txFuncSign = tx.input.slice(2, 10);
                let txFuncInput = '0x' + tx.input.slice(10);

                if (txFuncSign != this._buyCoinFnSign) {
                    continue
                }

                let param = web3Util.decodeParameters(this._buyCoinJson.inputs, txFuncInput);
                let otaPub = wanUtil.recoverPubkeyFromWaddress(param.OtaAddr);

                // this._addOTAAddress(param.OtaAddr, param.Value.toString());

                for (let j = 0; j < keys.length; j++) {
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

                    let A1 = wanUtil.generateA1(Buffer.from(myKey.privKeyB, 'hex'),
                        Buffer.from(myKey.pubKeyA, 'hex'),
                        otaPub.B);

                    if (A1.toString('hex') === otaPub.A.toString('hex')) {
                        logger.info("Found OTA: '%s', value: %s", param.OtaAddr, param.Value.toString());
                        try {
                            let state = 'Found';
                            if (await this._isOtaUsed(param.OtaAddr, myKey.privKeyA, myKey.privKeyB)) {
                                state = 'Refund';
                            }
                            let myOTA = {
                                "txhash": tx.hash,
                                "toOTA": param.OtaAddr,
                                "toAcctID": keys[j],
                                "value": param.Value.toString(),
                                "from": tx.from,
                                "blockNo": tx.blockNumber,
                                "state": state,
                            }
                            usrOTA.insert(myOTA);
                        } catch (err) {
                            if (err instanceof error.DuplicateRecord) {
                                logger.warn("OTA tx already exist! txHash = %s", tx.hash);
                            } else if (err instanceof error.NotReady) {
                                logger.warn(err.message);
                                return -1;
                            } else {
                                throw err;
                            }

                        }
                        break;
                    }

                }
            }

        }
        // update scan info
        for (let i = 0; i < keys.length; i++) {
            logger.debug("Update scan:", keys[i])
            let prev = accTbl.read(keys[i]);
            if (!prev) {
                logger.error("Check OTA for %s not exist", keys[i]);
                continue
            }

            let up = {
                "acctID": keys[i],
                "scanned": {
                    "begin": begin < prev.scanned.begin ? begin : prev.scanned.begin,
                    "end": end > prev.scanned.end ? end : prev.scanned.end
                }
            }
            accTbl.update(keys[i], up);

        }

        return count;

    },

    async _isOtaUsed(ota, privateKeyA, privateKeyB) {
        let ret = false;
        try {
            let otaDb = global.wanScanDB.getOTAStorage();
            let otaSet = otaDb.getOTAMixSet(ota, utils.getConfigSetting('privateTx:ringSize', 8));
            let image = '0x' + utils.createPrivateImage(ota, privateKeyA, privateKeyB, otaSet).toString('hex');
            ret = await ccUtil.checkOTAUsed(image);
            logger.info('OTA %s is used: %s', ota, ret);
        } catch (err) {
            if (err instanceof error.NotFound) {
                logger.warn(err.message);
                throw new error.NotReady('Local OTA database is not ready');
            } else {
                logger.error("Some error occurred. OTA: %s, private key1 length: %d, key2 length: %d", ota, privateKeyA.length, privateKeyB.length);
                throw err
            }
        }
        return ret;
    },

    _adjustBatchSize() {
        let batchSize = this._lastBatchSize;
        let lastCount = this._lastOTAinBatch;

        if (lastCount < 0) {
            batchSize = batchSize / 2 < _SCAN_BATCH_SIZE ? batchSize / 2 : _SCAN_BATCH_SIZE;
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

        let myAcct = Buffer.from(_MY_ACCT).toString('base64');
        let r = accTbl.read(myAcct);

        let txs;
        if (!r || bgn < r.scanned.begin || end > r.scanned.end) {
            txs = await ccUtil.getTransByAddressBetweenBlocks('WAN', wanUtil.contractCoinAddress, bgn, end - 1);
        } else {
            let f = function (t) {
                if (t.blockNumber && t.blockNumber >= bgn && t.blockNumber <= end) {
                    return true;
                }
                return false;
            }

            txs = otaTbl.filter(f)
        }

        return txs
    },

    async fetchTransaction() {
        let accTbl = this._otaStore.getAcctTable();

        let myAcct = Buffer.from(_MY_ACCT).toString('base64');

        try {
            let bgn, end;
            let latestBlock = await ccUtil.getBlockNumber('WAN');
            let r = accTbl.read(myAcct);
            if (!r) {
                r = {
                    "acctID": myAcct,
                    "scanned": {
                        "begin": latestBlock,
                        "end": latestBlock
                    }
                }
                accTbl.insert(r);
            }

            let fetchSize = self._adjustPreFetchSize();
            let hardEnd = latestBlock - _SCAN_BOUNDARY;
            bgn = r.scanned.begin - fetchSize < 0 ? 0 : r.scanned.begin - fetchSize;
            end = r.scanned.end + fetchSize < hardEnd ? r.scanned.end + fetchSize : hardEnd;

            /** Enlarge the scan interval after the first chain scan is finished */
            if ((end < r.scanned.end + _FETCH_FINISHED_CONDITION) && (r.scanned.begin < bgn + _FETCH_FINISHED_CONDITION)) {
                this._fetchInterval = _FETCH_INTERVAL;
            } else {
                this._fetchInterval = _MIN_FETCH_INTERVAL;
            }

            if (r.scanned.end < end) {
                await this._doFetch(r.scanned.end, end);
                r.scanned.end = end;
            }

            if (bgn < r.scanned.begin) {
                await this._doFetch(bgn, r.scanned.begin)
                r.scanned.begin = bgn;
            }

            accTbl.update(myAcct, r);

        } catch (err) {
            logger.error("Caught error when fetching block: ", err)
        }

        if (!this.done) {
            self.preFetchTimer = setTimeout(
                function () {
                    self.fetchTransaction();
                }, this._fetchInterval);
        }
    },

    sleep(time) {
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                resolve();
            }, time);
        });
    },

    async _doFetch(bgn, end) {
        let otaTbl = this._otaStore.getOTATable();

        logger.info("Do fetch tx in range [%d, %d), length: %d", bgn, end, end - bgn)
        let getTxByBlock = async function (bgn, end) {
            let promiseArray = [];
            for (let i = bgn; i <= end; i++) {
                promiseArray.push(ccUtil.getTransByBlock('WAN', i));
            }

            let timeout = utils.getConfigSetting("network:timeout", 300000);
            let ret = await utils.promiseTimeout(timeout, Promise.all(promiseArray), 'Get tx timed out!');

            let txs = [];
            for (let i = 0; i < ret.length; i++) {
                if (!ret[i]) {
                    continue
                }
                for (let j = 0; j < ret[i].length; j++) {
                    txs.push(ret[i][j]);
                }

            }

            return txs;
        };

        let getTxByAddr = async function (bgn, end) {
            return await ccUtil.getTransByAddressBetweenBlocks('WAN', wanUtil.contractCoinAddress, bgn, end - 1);
        };

        let getTx = {
            "getTransByBlock": getTxByBlock,
            "getTransByAddressBetweenBlocks": getTxByAddr
        };

        let fn = getTx[_FETCH_API];
        if (typeof fn === 'undefined') {
            fn = getTxByAddr;
        }

        try {
            let t1 = Date.now();
            logger.debug('Try to fetch txs from %d to %d, length: %s ...', bgn, end, (end - bgn))
            let otas = await fn(bgn, end);
            let t2 = Date.now();

            this._lastFetchTime = t2 - t1;
            logger.debug('Cost time: %d ms', t2 - t1);

            if (!otas) {
                return;
            }
            logger.debug("Totally fetched %d OTA txs", otas.length);
            for (let i = 0; i < otas.length; i++) {
                /** Release CPU after handle a batch of OTA in case of application is busy */
                if ((i !== 0) && (i % _HANDLE_OTA_ONE_TIME === 0)) {
                    await this.sleep(500);
                }
                let tx = otas[i];
                if (tx.to != wanUtil.contractCoinAddress) {
                    continue
                }

                let txFuncSign = tx.input.slice(2, 10);
                let txFuncInput = '0x' + tx.input.slice(10);

                if (txFuncSign != self._buyCoinFnSign) {
                    continue
                }

                let param = web3Util.decodeParameters(this._buyCoinJson.inputs, txFuncInput);
                this._addOTAAddress(param.OtaAddr, param.Value.toString());

                let ota = {
                    "blockNumber": tx.blockNumber,
                    "hash": tx.hash,
                    "from": tx.from,
                    "to": tx.to,
                    "input": tx.input
                }

                try {
                    otaTbl.insert(ota);
                } catch (err) {
                    if (err instanceof error.DuplicateRecord) {
                        logger.debug("Fetch ota tx already exist! txhash=%s", tx.hash);
                    } else {
                        throw err
                    }
                }
            }
            logger.debug("Insert OTA tx to DB successfully");
        } catch (err) {
            this._lastFetchTime = -1;
            throw err
        }

    },

    _adjustPreFetchSize() {
        let batchSize = this._lastFetchSize;
        let lastTiming = this._lastFetchTime; // timing in ms

        if (_FETCH_API == "getTransByBlock") {
            return _SCAN_BATCH_MIN;
        }

        if (lastTiming < 0) {
            batchSize = batchSize / 2 < _SCAN_BATCH_SIZE ? batchSize / 2 : _SCAN_BATCH_SIZE;
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
    },

    _addOTAAddress(addr, value) {
        let otaSta = this._otaStore.getOTAStorage();
        try {
            otaSta.addOTAIfNotExist(addr, value);
        } catch (err) {
            // This may not an error, cause it may already insert into db by other thread.
            logger.info("Caught exception when insert OTA record: ", err);
        }
    },

    _addOTAImage() {

    }
}
exports.MonitorOTA = MonitorOTA;
