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

const WID     = require('./walletids');
const HDWallet= require('./hdwallet');
const wanUtil = require('../../util/util');
const error   = require('../../api/error');

const logger = wanUtil.getLogger("nativewallet.js");
/**
 * HD wallet implementation.
 * This provides a software wallet. And all HD wallet should follow it's API
 */
class NativeWallet extends HDWallet {
    /**
     */
    constructor(seed) {
        super();
        this._hdkey = HDKey.fromMasterSeed(seed);
    }

    /**
     */
    static fromMnemonic(mnemonic) {
        let seed = new Mnemonic(mnemonic).toSeed();
        return NativeWallet.fromMasterSeed(seed);
    }

    /**
     */
    static fromMasterSeed(seed) {
        return new NativeWallet(seed);
    }

    /**
     * Identity number
     */
    static id() {
        return WID.WALLET_ID_NATIVE;
    }

    static name () {
        return WID.toString(NativeWallet.id());
    }

    /**
     */
    open() {
        logger.info("%s opened.", NativeWallet.name());
        return true;
    }

    /**
     */
    close() {
        logger.info("%s closed.", NativeWallet.name());
        return true;
    }

    /**
     */
    async healthCheck() {
        return true;
    }

    /**
     */
    getPublicKey(path, opt) {
        let child = this._hdkey.derive(path);
        return child.publicKey;
    }

    /**
     */
    getPrivateKey(path, opt) {
        opt = opt || {};

        let forcechk = opt.forcechk || false; // TODO: force check by default
        if (forcechk) {
            if (!opt.password) {
                logger.error("Missing password when requesting private key!");
                throw new error.InvalidParameter("Missing password when requesting private key!");
            }

            if (!opt.chkfunc) {
                logger.error("Missing check function but enabled force checking!");
                throw new error.InvalidParameter("Missing check function but enabled force checking!");
            }

            if (!opt.chkfunc(opt.password)) {
                logger.error("Get privte key check failed!");
                throw new error.WrongPassword("Get private key check failed!");
            }
        }

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
       throw new error.NotImplemented("Not implemented");
    }
}

module.exports = NativeWallet;

/* eof */

