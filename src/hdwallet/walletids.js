/**
 *
 */
'use strict';

const WALLET_ID_NATIVE = 0x01;   // Native WAN HD wallet
const WALLET_ID_LEDGER = 0x02;
const WALLET_ID_TREZOR = 0x03;
const WALLET_ID_LAST   = WALLET_ID_TREZOR;

const walletIDStringRep = [
    "Native",
    "Ledger",
    "Trezor"
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
    WALLET_ID_NATIVE,
    WALLET_ID_LEDGER,
    WALLET_ID_TREZOR,

    toString(id) {
        if (id > WALLET_ID_LAST) {
            throw new Error(`Invalid wallet ID ${id}`);
        }
        return walletIDStringRep(id);
    }
};
