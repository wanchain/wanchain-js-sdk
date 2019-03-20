/**
 * WAN HD wallet
 *
 * HD wallet that follows BIP44
 *
 * Copyright (c) Wanchain, all rights reserved 
 */
'use strict';

const WID = require("./walletids");
/**
 * HD wallet definition.
 * This provides a software wallet. And all HD wallet should follow it's API
 */
class HDWallet {
    constructor(cap) {
        this._cap = cap || (WID.WALLET_CAPABILITY_GET_PUBKEY | WID.WALLET_CAPABILITY_GET_PRIVATEKEY);
    }

    /**
     * Identity number 
     */
    static id() {
        return WID.WALLET_ID_BASE;
    }

    static name () {
        return WID.toString(HDWallet.id());
    }

    isSupport(cap) {
        return this._cap & cap;
    }

    isSupportGetPrivateKey() {
        return this.isSupport(WID.WALLET_CAPABILITY_GET_PRIVATEKEY);
    }

    isSupportSignTransaction() {
        return this.isSupport(WID.WALLET_CAPABILITY_SIGN_TRANSACTION);
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
    async getPublicKey(path) {
        throw new Error("Not implemented");
    }

    /**
     */
    async getPrivateKey(path) {
        throw new Error("Not implemented");
    }

    /**
     * Sign raw message using SEC(Standard for Efficent Cryptography) 256k1 curve
     *
     * @param {path} string, BIP44 path to locate private to sign the message
     * @param {buf} Buffer, raw message to sign
     * @return {Object} - {r, s, v}
     */
    async sec256k1sign(path, buf) {
       throw new Error("Not implemented");
    }
}

module.exports = HDWallet;

/* eof */

