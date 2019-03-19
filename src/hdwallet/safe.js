/**
 * Safe, keeps HD wallet
 *
 * Copyright (c) 2019 Wanchain, Licensed under MIT.
 */
'use strict';

const NativeWallet = require('./wallets/nativewallet');
//const LedgerWallet = require('./wallets/ledger');
const wanUtil  = require('../util/util');

const _WALLET_INFO_KEY_NAME  = "name";
const _WALLET_INFO_KEY_INST  = "instance";
const _WALLET_INFO_KEY_LFAIL = "lastFail";
const _WALLET_INFO_KEY_LCHK  = "lastCheck";
const _WALLET_INFO_KEY_CONSF = "consecutiveFail";

const _WALLET_FAIL_EVT_TRIGGER_CNT = 10;

const _WALLET_CHECK_INTERVAL_5S = 5000; // 5 seconds
const _WALLET_CHECK_INTERVAL = _WALLET_CHECK_INTERVAL_5S;

let logger = wanUtil.getLogger("safe.js");

class Safe {
    /**
     */
    constructor() {
        this._wallet = {};
        this._healthCheck = setInterval(this.healthCheck, _WALLET_CHECK_INTERVAL);
    }

    close() {
        if (this._healthCheck) {
            clearInterval(this._healthCheck);
        }
    }

    getWallet(id) {
        if (!id) {
            throw new Error("Missing parameter");
        }

        if (!this._wallet.hasOwnProperty(id)) {
            throw new Error(`Wallet not found, id=${id}`);
        }

        return this._wallet[id][_WALLET_INFO_KEY_INST];
    }

    newNativeWallet(mnemonic) {
        logger.info("New HD wallet from mnemonic");

        let id = NativeWallet.id();
        if (this._wallet.hasOwnProperty(id)) {
            logger.error("Native wallet already exist, delete it first");
            throw new Error("Nativae wallet already exist, delete it first");
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
        return w;
    }

    deleteNativeWallet() {
        logger.info("Deleting native wallet ...");
        let id = NativeWallet.id();

        if (this._wallet.hasOwnProperty(id)) {
            logger.info("Deleting ...");

            let w = this.getWallet(id);
            w.close();

            delete this._wallet[id];
        }
        logger.info("Delete native wallet completed.");
    }

    newLedgerWallet() {
        logger.info("Connecting ledger wallet...");

        //let id = LedgerWallet.id();
        //if (this._wallet.hasOwnProperty(id)) {
        //    logger.error("Ledger wallet already exist, delete it first");
        //    throw new Error("Ledger wallet already exist, delete it first");
        //}

        //let w = LedgerWallet();
        //if (!w.open()) {
        //    logger.error("Open Ledger wallet failed!");
        //    throw new Error("Open Ledger wallet failed!");
        //}         

        ///**
        // */
        //let winfo = {
        //    [_WALLET_INFO_KEY_NAME] : LedgerWallet.name(),
        //    [_WALLET_INFO_KEY_INST] : w,
        //    [_WALLET_INFO_KEY_LFAIL]: null,
        //    [_WALLET_INFO_KEY_LCHK] : null,
        //    [_WALLET_INFO_KEY_CONSF]: 0
        //};

        //this._wallet[id] = winfo;
        return w;
    }

    newTrezorWallet() {
        logger.info("Connect trezor wallet");
    }

    deleteLedgerWallet() {
        logger.info("Remove ledger wallet");
    }

    deleteTrezorWallet() {
        logger.info("Remove trezor wallet");
    }

    getWallets() {
        let wallets = [];
        for (id in this._wallet) {
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

    async healthCheck() {
        let now = Date.now();
        for (id in this._wallet) {
            if (this._wallet.hasOwnProperty(id)) {
                let winfo = this._wallet[id];
                let w = winfo[_WALLET_INFO_KEY_INST];

                let h = await w.healthCheck();
                if (h) {
                    winfo[_WALLET_INFO_KEY_CONSF] = 0;
                } else {
                    winfo[_WALLET_INFO_KEY_LFAIL] = now;
                    winfo[_WALLET_INFO_KEY_CONSF]++;
                }
                winfo[_WALLET_INFO_KEY_LCHK] = now;

                if (winfo[_WALLET_INFO_KEY_CONSF] >= _WALLET_FAIL_EVT_TRIGGER_CNT) {
                    // TODO: send an event
                    logger.error("Wallet %s health check failed %d times", 
                                    winfo[_WALLET_INFO_KEY_NAME], winfo[_WALLET_INFO_KEY_CONSF]);
                }
            }
        }
    }
}

module.exports = Safe;
