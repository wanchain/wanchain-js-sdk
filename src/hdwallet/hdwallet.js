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

/**
 *
 */
class HDWallet {
    /**
     */
    constructor(seed) {
        this._hdkey = HDKey.fromMasterSeed(seed);
    } 

    static fromMnemonic(mnemonic) {
        let seed = new Mnemonic(mnemonic).toSeed();
        return HDWallet.fromMasterSeed(seed);
    }

    static fromMasterSeed(seed) {
        return new HDWallet(seed);
    }

    getPublicKey(path) {
        let child = this._hdkey.derive(path);
        return child.publicKey;
    }

    getPrivateKey(path) {
        let child = this._hdkey.derive(path);
        return child.privateKey;
    }

    signMessage(path, msg) {
       throw new Error("Not implemented");
    }
}

module.exports = HDWallet;

/* eof */

