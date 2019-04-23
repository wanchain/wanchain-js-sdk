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

let logger = utils.getLogger('monitorOTA.js');

/**
 */
const   MonitorOTA   = {
    init(otaDB){
        this._otaStore = otaDB;
        this._checkAccts = {};

        //
        // Get 'buyCoinNote' ABI
        this._buyCoinJson = web3Util.getMethodABIDefine('buyCoinNote', wanUtil.coinSCAbi);
        this._buyCoinFnSign = web3Util.signFunction(this._buyCoinJson).slice(0,8);
        logger.debug("buyCoin sign", this._buyCoinFnSign);

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
        let otaTbl = this._otaStore.getOTATable();
        let accTbl = this._otaStore.getAcctTable();

        let scanBatchSize= utils.getConfigSetting("privateTX:scan:batchSize", 1000);
        let scanBoundary = utils.getConfigSetting("privateTX:scan:boundary", 5);

        let latestBlock = await ccUtil.getBlockNumber('WAN');

        let scanHardEnd = latestBlock - scanBoundary;

        logger.debug("OTA scan hard end: ", scanHardEnd);

        let highBegin = scanHardEnd;
        let lowEnd = 0;

        let keys = Object.keys(this._checkAccts)
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

        logger.debug("Scan LowEnd=%d, HighBegin=%d", lowEnd, highBegin);
        if (highBegin < scanHardEnd) {
            let highEnd = highBegin + scanBatchSize < scanHardEnd ? highBegin + scanBatchSize : scanHardEnd;
            await this.scanRange(highBegin, highEnd, keys)
        }

        if (lowEnd > 0) {
            let lowBegin = lowEnd - scanBatchSize > 0 ? lowEnd - scanBatchSize : 0;
            await this.scanRange(lowBegin, lowEnd, keys)
        }

    },

    async scanRange(begin, end, keys) {
        let otaTbl = this._otaStore.getOTATable();
        let accTbl = this._otaStore.getAcctTable();

        logger.info(`Scan OTA range '[${begin}, ${end})'`)
        let txs = await ccUtil.getTransByAddressBetweenBlocks('WAN', wanUtil.contractCoinAddress, begin, end);

        if (txs) {
            logger.info("Total got %d transactins in the range", txs.length);

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
                        logger.info("Found OTA tx for address: %s, value: %d", keys[j], param.Value);
                        try {
                            let myOTA = {
                                 "txhash"   : tx.hash,
                                 "toOTA"    : param.OtaAddr,
                                 "toAcctID" : keys[j],
                                 "value"    : param.Value,
                                 "from"     : tx.from,
                                 "blockNo"  : tx.blockNumber,
                                 "state"    : "Found",
                            }
                            otaTbl.insert(myOTA);
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

    }
}
exports.MonitorOTA = MonitorOTA;
