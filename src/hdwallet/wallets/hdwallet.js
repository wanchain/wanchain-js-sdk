/**
 * WAN HD wallet
 *
 * HD wallet that follows BIP44
 *
 * Copyright (c) Wanchain, all rights reserved
 */
'use strict';

const error = require('../../api/error');
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

    isSupportGetPublicKey() {
        return this.isSupport(WID.WALLET_CAPABILITY_GET_PUBKEY);
    }

    isSupportSignTransaction() {
        return this.isSupport(WID.WALLET_CAPABILITY_SIGN_TRANSACTION);
    }

    isSupportExportKeyStore() {
        return this.isSupport(WID.WALLET_CAPABILITY_EXPORT_KEYSTORE);
    }

    isSupportGetAddress() {
        return this.isSupport(WID.WALLET_CAPABILITY_GET_ADDRESS);
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
    async healthCheck() {
        return true;
    }

    /**
     */
    async getPublicKey(path, opt) {
        throw new error.NotImplemented("Not implemented");
    }

    /**
     */
    async getPrivateKey(path, opt) {
        throw new error.NotImplemented("Not implemented");
    }

    /**
     * Sign raw message using SEC(Standard for Efficent Cryptography) 256k1 curve
     *
     * @param {path} string, BIP44 path to locate private to sign the message
     * @param {buf} Buffer, raw message to sign
     * @return {Object} - {r, s, v}
     */
    async sec256k1sign(path, buf) {
       throw new error.NotImplemented("Not implemented");
    }
}

module.exports = HDWallet;

/* eof */

