/**
 * Ledger wallet
 *
 * Licensed under MIT.
 * Copyright (c) 2019, Wanchain.
 */

const TransportNodeHid = require("@ledgerhq/hw-transport-node-hid");
const splitPath        = require("@ledgerhq/hw-app-eth");

const WID     = require('./walletids');
const HDWallet= require('./hdwallet');
const wanUtil = require('../../util/util');

const logger = wanUtil.getLogger("ledger.js");

/**
 * Ledger wallet implementation
 */
class LedgerWallet extends HDWallet {
    /**
     */
    constructor() {
        super();
        this._transport = null;
    }

    /**
     * Identity number 
     */
    static id() {
        return WID.WALLET_ID_LEDGER;
    }

    static name () {
        return WID.toString(LedgerWallet.id());
    }

    /**
     */
    async open() {
        try {
            this._transport = await TransportNodeHid.open("");

            logger.info("%s opened", LedgerWallet.name());
            return true;
        } catch(err) {
            logger.error("%s opene failed: %s", err);
            return false;
        }
    }

    /**
     */
    close() {
        if (this._transport) {
            this._transport.close();
        }

        logger.info("%s closed", LedgerWallet.name());
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
        let child = this._hdkey.derive(path);
        return child.publicKey;
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

module.exports = LedgerWallet;

/* eof */
