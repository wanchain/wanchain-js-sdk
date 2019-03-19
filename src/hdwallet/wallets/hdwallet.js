/**
 * WAN HD wallet
 *
 * HD wallet that follows BIP44
 *
 * Copyright (c) Wanchain, all rights reserved 
 */
'use strict';

/**
 * HD wallet definition.
 * This provides a software wallet. And all HD wallet should follow it's API
 */
class HDWallet {
    /**
     * Identity number 
     */
    static id() {
        return WID.WALLET_ID_BASE;
    }

    static name () {
        return WID.toString(HDWallet.id());
    }

    /**
     */
    open() {
        return true;
    }

    /**
     */
    close() {
        return true;
    }

    /**
     */
    healthCheck() {
        return true;
    }

    /**
     */
    getPublicKey(path) {
        throw new Error("Not implemented");
    }

    /**
     */
    getPrivateKey(path) {
        throw new Error("Not implemented");
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

