/**
 * Safe, keeps HD wallet
 *
 * Copyright (c) 2019 Wanchain, Licensed under MIT.
 */
'use strict';

const NativeWallet = require('./wallets/nativewallet');
const LedgerWallet = require('./wallets/ledger');
const RawKeyWallet = require('./wallets/rawkey');
const KeyStoreWallet= require('./wallets/keystore');
const wanUtil  = require('../util/util');
const error    = require('../api/error');

const _WALLET_INFO_KEY_NAME  = "name";
const _WALLET_INFO_KEY_INST  = "instance";
const _WALLET_INFO_KEY_LFAIL = "lastFail";
const _WALLET_INFO_KEY_LCHK  = "lastCheck";
const _WALLET_INFO_KEY_CONSF = "consecutiveFail";

const _WALLET_FAIL_EVT_TRIGGER_CNT = 10;

const _WALLET_CHECK_INTERVAL_1M = 60000; // one minute
const _WALLET_CHECK_INTERVAL = _WALLET_CHECK_INTERVAL_1M;

let logger = wanUtil.getLogger("safe.js");

class Safe {
    /**
     */
    constructor() {
        let self = this;
        self._wallet = {};
        self._healthCheck = setInterval(function() {self.healthCheck();},
                        _WALLET_CHECK_INTERVAL);
    }

    /**
     */
    close() {
        if (this._healthCheck) {
            clearInterval(this._healthCheck);
        }
    }

    /**
     */
    getWallet(id) {
        if (!id) {
            //throw new Error("Missing parameter!");
            throw new error.InvalidParameter("Missing parameter!");
        }

        if (!this._wallet.hasOwnProperty(id)) {
            //throw new Error(`Wallet not found, id=${id}`);
            throw new error.NotFound(`Wallet not found, id=${id}`);
        }

        return this._wallet[id][_WALLET_INFO_KEY_INST];
    }

    /**
     */
    newNativeWallet(mnemonic) {
        logger.info("Creating HD wallet from mnemonic...");

        let id = NativeWallet.id();
        if (this._wallet.hasOwnProperty(id)) {
            logger.error("Native wallet already exist, delete it first!");
            //throw new Error("Nativae wallet already exist, delete it first!");
            throw new error.LogicError("Native wallet already exist, delete it first!");
        }

        let w = NativeWallet.fromMnemonic(mnemonic);
        w.open();

        /**
         */
        let winfo = {
            [_WALLET_INFO_KEY_NAME] : NativeWallet.name(),
            [_WALLET_INFO_KEY_INST] : w,
            [_WALLET_INFO_KEY_LFAIL]: null,
            [_WALLET_INFO_KEY_LCHK] : null,
            [_WALLET_INFO_KEY_CONSF]: 0
        };

        this._wallet[id] = winfo;
        logger.info("Create HD native wallet completed.");
        return w;
    }

    /**
     */
    deleteNativeWallet() {
        logger.info("Deleting native wallet...");
        let id = NativeWallet.id();

        this._deleteWallet(id);

        logger.info("Delete native wallet completed.");
    }

    /**
     */
    newRawKeyWallet(seed) {
        logger.info("Creating raw key wallet...");

        let id = RawKeyWallet.id();
        if (this._wallet.hasOwnProperty(id)) {
            logger.error("Raw key wallet already exist, delete it first!");
            //throw new Error("Raw key wallet already exist, delete it first!");
            throw new error.LogicError("Raw key wallet already exist, delete it first!");
        }

        let w = new RawKeyWallet(seed);
        w.open();

        /**
         */
        let winfo = {
            [_WALLET_INFO_KEY_NAME] : RawKeyWallet.name(),
            [_WALLET_INFO_KEY_INST] : w,
            [_WALLET_INFO_KEY_LFAIL]: null,
            [_WALLET_INFO_KEY_LCHK] : null,
            [_WALLET_INFO_KEY_CONSF]: 0
        };

        this._wallet[id] = winfo;
        logger.info("Create raw key wallet completed.");
        return w;
    }

    /**
     */
    deleteRawKeyWallet() {
        logger.info("Deleting raw key wallet...");
        let id = RawKeyWallet.id();

        this._deleteWallet(id);

        logger.info("Delete raw key wallet completed.");
    }

    /**
     */
    newKeyStoreWallet(seed) {
        logger.info("Creating keystore wallet...");

        let id = KeyStoreWallet.id();
        if (this._wallet.hasOwnProperty(id)) {
            logger.error("Keystore wallet already exist, delete it first!");
            //throw new Error("Keystore wallet already exist, delete it first!");
            throw new error.LogicError("Keystore wallet already exist, delete it first!");
        }

        let w = new KeyStoreWallet(seed);
        w.open();

        /**
         */
        let winfo = {
            [_WALLET_INFO_KEY_NAME] : KeyStoreWallet.name(),
            [_WALLET_INFO_KEY_INST] : w,
            [_WALLET_INFO_KEY_LFAIL]: null,
            [_WALLET_INFO_KEY_LCHK] : null,
            [_WALLET_INFO_KEY_CONSF]: 0
        };

        this._wallet[id] = winfo;
        logger.info("Create keystore wallet completed.");
        return w;
    }

    /**
     */
    deleteKeyStoreWallet() {
        logger.info("Deleting keystore wallet...");
        let id = KeyStoreWallet.id();

        this._deleteWallet(id);

        logger.info("Delete keystore wallet completed.");
    }

    /**
     */
    async newLedgerWallet() {
        logger.info("Connecting to ledger wallet...");

        let id = LedgerWallet.id();
        if (this._wallet.hasOwnProperty(id)) {
            logger.warn("Ledger wallet already exist, delete it first!");
            await deleteLedgerWallet();
        }

        let w = new LedgerWallet();
        let opened = await w.open();
        if (!opened) {
            logger.error("Open Ledger wallet failed!");
            throw new error.RuntimeError("Open Ledger wallet failed!");
        }         

        /**
         */
        let winfo = {
            [_WALLET_INFO_KEY_NAME] : LedgerWallet.name(),
            [_WALLET_INFO_KEY_INST] : w,
            [_WALLET_INFO_KEY_LFAIL]: null,
            [_WALLET_INFO_KEY_LCHK] : null,
            [_WALLET_INFO_KEY_CONSF]: 0
        };

        this._wallet[id] = winfo;
        logger.info("Connect to ledger wallet completed.");

        return w;
    }

    newTrezorWallet() {
        logger.info("Connecting to trezor wallet...");
        logger.info("Connect to trezor completed.");
    }

    async deleteLedgerWallet() {
        logger.info("Deleting ledger wallet...");
        let id = LedgerWallet.id();

        await this._deleteWallet(id);

        logger.info("Delete native wallet completed.");
    }

    deleteTrezorWallet() {
        logger.info("Deleting trezor wallet...");
        logger.info("Delete trezor wallet completed.");
    }

    /**
     */
    getWallets() {
        let wallets = [];
        for (let id in this._wallet) {
            if (this._wallet.hasOwnProperty(id)) {
                let winfo = this._wallet[id];
                wallets.push({
                    "id"   : id,
                    "name" : winfo[_WALLET_INFO_KEY_NAME]
                });
            }
        }

        return wallets;
    }

    /**
     */
    async healthCheck() {
        let now = Date.now();
        let timeout   = wanUtil.getConfigSetting("wallets:healthcheck:timeout", 5000);
        let threshold = wanUtil.getConfigSetting("wallets:healthcheck:threshold", _WALLET_FAIL_EVT_TRIGGER_CNT);

        logger.debug("Health check running...");
        try {
            for (let id in this._wallet) {
                if (this._wallet.hasOwnProperty(id)) {
                    let winfo = this._wallet[id];
                    let w = winfo[_WALLET_INFO_KEY_INST];

                    logger.debug("Checking wallet '%s'...", winfo[_WALLET_INFO_KEY_NAME]);

                    let h = null;
                    try {
                        let p = w.healthCheck();

                        h = await wanUtil.promiseTimeout(timeout, p);
                    } catch (err) {
                        logger.error("Caught error when checking '%s': %s",  winfo[_WALLET_INFO_KEY_NAME], err);
                    }

                    if (h) {
                        logger.debug("Wallet '%s' is healthy.", winfo[_WALLET_INFO_KEY_NAME]);
                        winfo[_WALLET_INFO_KEY_CONSF] = 0;
                    } else {
                        logger.debug("Wallet '%s' failed to response!", winfo[_WALLET_INFO_KEY_NAME]);
                        winfo[_WALLET_INFO_KEY_LFAIL] = now;
                        winfo[_WALLET_INFO_KEY_CONSF]++;
                    }

                    winfo[_WALLET_INFO_KEY_LCHK] = now;

                    if (winfo[_WALLET_INFO_KEY_CONSF] >= threshold) {
                        // TODO: send an event
                        logger.error("Wallet %s health check failed %d times!", 
                                        winfo[_WALLET_INFO_KEY_NAME], winfo[_WALLET_INFO_KEY_CONSF]);
                    }
                }
            }
        } catch (err) {
            logger.error("Caught error when healthcheck: %s", err);
        }
    }

   async  _deleteWallet(id) {
        if (this._wallet.hasOwnProperty(id)) {
            logger.info("Deleting ...");
            try {
                let w = this.getWallet(id);
                await w.close();

                delete this._wallet[id];
            } catch (err) {
                logger.error("Caught error when deleting wallet: ", err);
            }
        }
    }
}

module.exports = Safe;

/* eof */

