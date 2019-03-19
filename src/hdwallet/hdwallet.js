/**
 * WAN HD wallet
 *
 * HD wallet that follows BIP44
 *
 * Copyright (c) Wanchain, all rights reserved 
 */
'use strict';

const HDKey = require('hdkey');
const Mnemonic = require('bitcore-mnemonic');

const WID = require('./walletids');

/**
 * HD wallet implementation.
 * This provides a software wallet. And all HD wallet should follow it's API
 */
class HDWallet {
    /**
     */
    constructor(seed) {
        this._hdkey = HDKey.fromMasterSeed(seed);
    } 

    /**
     */
    static fromMnemonic(mnemonic) {
        let seed = new Mnemonic(mnemonic).toSeed();
        return HDWallet.fromMasterSeed(seed);
    }

    /**
     */
    static fromMasterSeed(seed) {
        return new HDWallet(seed);
    }

    /**
     * Identity number 
     */
    static id() {
        return WID.WALLET_ID_NATIVE;
    }

    static name () {
        return WID.toString(HDWallet.id());
    }

    /**
     */
    open() {
    }

    /**
     */
    close() {
    }

    /**
     */
    healthCheck() {
        return true;
    }

    /**
     */
    getPublicKey(path) {
        let child = this._hdkey.derive(path);
        return child.publicKey;
    }

    /**
     */
    getPrivateKey(path) {
        let child = this._hdkey.derive(path);
        return child.privateKey;
    }

    /**
     * Sign raw message using SEC(Standard for Efficent Cryptography) 256k1 curve
     *
     * @param {path} string, BIP44 path to locate private to sign the message
     * @param {buf} Buffer, raw message to sign
     * @return {Object} - {r, s, v}
     */
    sec256k1sign(path, buf) {
       throw new Error("Not implemented");
    }
}

module.exports = HDWallet;

/* eof */
