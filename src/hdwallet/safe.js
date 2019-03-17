/**
 * Safe, keeps HD wallet
 *
 * Copyright (c) Wanchain, all rights reserved.
 */
'use strict';

const HDWallet = require('./hdwallet');

const _WALLET_INFO_KEY_NAME  = "name";
const _WALLET_INFO_KEY_INST  = "instance";
const _WALLET_INFO_KEY_LFAIL = "lastFail";
const _WALLET_INFO_KEY_LCHK  = "lastCheck";
const _WALLET_INFO_KEY_CONSF = "consecutiveFail";

const _WALLET_FAIL_EVT_TRIGGER_CNT = 10;

class Safe {
    /**/
    constructor(walletStore) {
        this._wallet = {};
    }

    getWallet(id) {
        if (!id) {
            throw new Error("Missing parameter");
        }

        if (this._wallet.hasOwnProperty(id)) {
            throw new Error(`Wallet not found, id=${id}`);
        }

        return this._wallet[id]["instance"];
    }

    newNativeWallet(mnemonic) {
        let w = HDWallet.fromMnemonic(mnemonic);

        /**
         */
        let winfo = {
            _WALLET_INFO_KEY_NAME : w.name(),
            _WALLET_INFO_KEY_INST : w,
            _WALLET_INFO_KEY_LFAIL: null,
            _WALLET_INFO_KEY_LCHK : null,
            _WALLET_INFO_KEY_CONSF: 0
        }
        this._wallet[w.id()] = winfo;
        return w;
    }

    newLedgerWallet() {
    }

    newTrezorWallet() {
    }

    async healthCheck() {
        let now = Date.now();
        for (id in this._wallet) {
            if (this._wallet.hasOwnProperty(id)) {
                let winfo = this._wallet[id];
                let winfo = winfo[_WALLET_INFO_KEY_INST];

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
                }
            }
        }
    }
}

module.exports = Safe;
