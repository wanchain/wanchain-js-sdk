/**
 * Constants
 * 
 * Support wallet: Native HD, Ledger, Trezor, WIF imported from private key, and keystore for ETH/WAN
 *
 * Copyright (c) Wanchain, all rigths reserved.
 */
'use strict';

const WALLET_ID_BASE     = 0x0;
const WALLET_ID_NATIVE   = 0x01;   // Native WAN HD wallet
const WALLET_ID_LEDGER   = 0x02;
const WALLET_ID_TREZOR   = 0x03;
const WALLET_ID_WIF      = 0x04;   // Bitcoin WIF
const WALLET_ID_KEYSTORE = 0x05;   // ETH/WAN keystore 
const WALLET_ID_RAWKEY   = 0x06;   
const WALLET_ID_LAST   = WALLET_ID_RAWKEY;

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
            throw new Error(`Invalid wallet ID ${id}`);
        }
        this._id = id;
    }

    toString() {
        return walletIDStringRep(this._id);
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

    toString(id) {
        if (id > WALLET_ID_LAST || id < WALLET_ID_BASE) {
            throw new Error(`Invalid wallet ID ${id}`);
        }
        return walletIDStringRep[id];
    }
};
