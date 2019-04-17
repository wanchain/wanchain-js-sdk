/**
 * Constants
 * 
 * Support wallet: Native HD, Ledger, Trezor, WIF imported from private key, and keystore for ETH/WAN
 *
 * Copyright (c) Wanchain, all rigths reserved.
 */
'use strict';

const error = require('../../api/error');

const WALLET_ID_BASE     = 0x0;
const WALLET_ID_NATIVE   = 0x01;   // Native WAN HD wallet
const WALLET_ID_LEDGER   = 0x02;
const WALLET_ID_TREZOR   = 0x03;
const WALLET_ID_WIF      = 0x04;   // Bitcoin WIF
const WALLET_ID_KEYSTORE = 0x05;   // ETH/WAN keystore 
const WALLET_ID_RAWKEY   = 0x06;   
const WALLET_ID_LAST   = WALLET_ID_RAWKEY;

// Wallet capability
const WALLET_CAPABILITY_GET_PUBKEY       = 0x01;
const WALLET_CAPABILITY_GET_ADDRESS      = 0x02;
const WALLET_CAPABILITY_GET_PRIVATEKEY   = 0x04;
const WALLET_CAPABILITY_SIGN_TRANSACTION = 0x08;
const WALLET_CAPABILITY_IMPORT_PRIVATE_KEY= 0x10;
const WALLET_CAPABILITY_IMPORT_KEYSTORE  = 0x20;
const WALLET_CAPABILITY_EXPORT_KEYSTORE  = 0x40;

const walletIDStringRep = [
    "Base",
    "Native",
    "Ledger",
    "Trezor",
    "BitcoinWIF",
    "KeyStore",
    "RawKey",
];

class WalletID {
    constructor(id) {
        if (id > WALLET_ID_LAST) {
            throw new error.InvalidParameter(`Invalid wallet ID ${id}`);
        }
        this._id = id;
    }

    toString() {
        return walletIDStringRep(this._id);
    }
}

class WalletOpt {
    /**
     * @param {password} string, password to unlock the wallet
     * @param {focechk} bool, force to check password
     * @param {chkfunc} function, the function to check password
     */
    constructor(password, forcechk, chkfunc) {
        this.password = password;
        this.forcechk = forcechk;
        this.chkfunc  = chkfunc; 
    }
}

module.exports = {
    WALLET_ID_BASE,
    WALLET_ID_NATIVE,
    WALLET_ID_LEDGER,
    WALLET_ID_TREZOR,
    WALLET_ID_WIF,
    WALLET_ID_KEYSTORE,
    WALLET_ID_RAWKEY,

    WALLET_CAPABILITY_GET_PUBKEY,
    WALLET_CAPABILITY_GET_ADDRESS,
    WALLET_CAPABILITY_GET_PRIVATEKEY,
    WALLET_CAPABILITY_SIGN_TRANSACTION,
    WALLET_CAPABILITY_IMPORT_PRIVATE_KEY,
    WALLET_CAPABILITY_IMPORT_KEYSTORE,
    WALLET_CAPABILITY_EXPORT_KEYSTORE,

    toString(id) {
        if (id > WALLET_ID_LAST || id < WALLET_ID_BASE) {
            throw new error.InvalidParameter(`Invalid wallet ID ${id}`);
        }
        return walletIDStringRep[id];
    },

    WalletOpt
};
