/**
 * Private key wallet
 *
 * Copyright (c) 2019 Wanchain.
 * It can be freely distributed under MIT license.
 */
'use strict';

const WID     = require('./walletids');
const HDWallet= require('./hdwallet');
const wanUtil = require('../../util/util');
const error   = require('../../api/error');
const ecc = require('eosjs-ecc');

const logger = wanUtil.getLogger("rawkey.js");

const _BIP44_PATH_LEN = 5;
const _CHAIN_GET_PUBKEY = {
    0    : wanUtil.sec256k1PrivToPub,  // Bitcoin
    1    : wanUtil.sec256k1PrivToPub,  // Bitcoin testnet
    60   : wanUtil.sec256k1PrivToPub,  // ETH
    194  : ecc.privateToPublic,  // EOS
    5718350   : wanUtil.sec256k1PrivToPub,  // WAN
    'BTC'    : wanUtil.sec256k1PrivToPub,  // Bitcoin
    'ETH'   : wanUtil.sec256k1PrivToPub,  // ETH
    'EOS'  : ecc.privateToPublic,  // EOS
    'WAN'   : wanUtil.sec256k1PrivToPub  // WAN
};

const _CIPHER_IV_MSG = "rawKeyWallet@wanchain";

/**
 * private key wallet implementation.
 * This provides a software wallet. And all HD wallet should follow it's API
 */
class RawKeyWallet extends HDWallet {
    /**
     */
    constructor(seed) {
        // supports get pubkey, privkey
        super(WID.WALLET_CAPABILITY_GET_PUBKEY|WID.WALLET_CAPABILITY_GET_PRIVATEKEY|WID.WALLET_CAPABILITY_IMPORT_PRIVATE_KEY);
        this._db   = global.hdWalletDB.getRawKeyTable();
        this._seed = seed;
    }

    /**
     * Identity number
     */
    static id() {
        return WID.WALLET_ID_RAWKEY;
    }

    static name () {
        return WID.toString(RawKeyWallet.id());
    }

    /**
     */
    open() {
        logger.info("%s opened.", RawKeyWallet.name());
        return true;
    }

    /**
     */
    close() {
        logger.info("%s closed.", RawKeyWallet.name());
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
        logger.info('Getting public key for path "%s"...', path);
        let p = wanUtil.splitBip44Path(path);
        if (p.length != _BIP44_PATH_LEN) {
            logger.error(`Invalid path: "${path}"`);
            throw new error.InvalidParameter(`Invalid path: "${path}"`);
        }

        let chainID = p[1];
        if (chainID >= 0x80000000) {
            // Hardened derivation
            chainID -= 0x80000000;
        }

        let getPubKey = wanUtil.sec256k1PrivToPub;
        if (_CHAIN_GET_PUBKEY.hasOwnProperty(chainID)) {
            getPubKey = _CHAIN_GET_PUBKEY[chainID];
        } else {
            logger.warn(`Chain "${chainID}" public key creation function not defined, assume sec256k1!`);
        }

        opt = opt || {"password" : this._seed}

        let ret = getPubKey(this._getPrivateKey(chainID, path, opt));

        logger.info("Getting public key for path %s is completed.", path);

        return ret;
    }

    /**
     */
    getPublicKeyByPrivateKey(chain, privateKey) {
        logger.info('Getting public key by private key...');

        let getPubKey = wanUtil.sec256k1PrivToPub;
        if (_CHAIN_GET_PUBKEY.hasOwnProperty(chain)) {
            getPubKey = _CHAIN_GET_PUBKEY[chain];
        } else {
            logger.warn(`Chain "${chain}" get address creation function not defined, assume sec256k1!`);
        }
        let ret = getPubKey(privateKey);

        logger.info("Getting public key is completed.");

        return ret;
    }

    /**
     */
    getPrivateKey(path, opt) {
        logger.info("Getting private key for path %s...", path);

        let p = wanUtil.splitBip44Path(path);
        if (p.length != _BIP44_PATH_LEN) {
            logger.error(`Invalid path: "${path}"`);
            throw new error.InvalidParameter(`Invalid path: "${path}"`);
        }

        let chainID = p[1];
        if (chainID >= 0x80000000) {
            // Hardened derivation
            chainID -= 0x80000000;
        }

        let ret =  this._getPrivateKey(chainID, path, opt);
        logger.info("Get private key for path %s is completed.", path);
        return ret;
    }

    /**
     */
    importPrivateKey(path, privateKey, opt) {
        logger.info("Importing private key...");
        let p = wanUtil.splitBip44Path(path);
        if (p.length != _BIP44_PATH_LEN) {
            logger.error(`Invalid path: "${path}"`);
            throw new error.InvalidParameter(`Invalid path: "${path}"`);
        }

        opt = opt || {};
        let password = opt.password || this._seed;
        if (!password) {
            logger.warn("Missing password when import private key!");
        }

        let chainID = p[1];
        if (chainID >= 0x80000000) {
            // Hardened derivation
            chainID -= 0x80000000;
        }

        logger.debug("chainID=%d.", chainID);

        let encrypted = this._encryptPrivateKey(privateKey.toString('hex'), password);
        let chainkey = this._db.read(chainID);
        if (!chainkey) {
            logger.info("Chain not exist for chainID=%d, insert new one.", chainID);
            chainkey = {
                "chainID" : chainID,
                "keys" : {
                    [path] : encrypted
                }
            }
            this._db.insert(chainkey);
            logger.info("Import private key completed!");
            return true;
        }

        if (chainkey.keys.hasOwnProperty(path)) {
            logger.error(`Illogic, data corrupt: chainID="${chainID}", path="${path}"!`);
            throw new error.LogicError(`Illogic, data corrupt: chainID="${chainID}", path="${path}"!`);
        }
        chainkey.keys[path] = encrypted;

        this._db.update(chainID, chainkey);
        logger.info("Import private key completed!");

        return true;
    }

    /**
     */
    size(chainID, path) {
        let chainkey = this._db.read(chainID);
        if (!chainkey) {
            return 0;
        }
        return Object.keys(chainkey.keys).filter(obj => {
            return obj.includes(path);
        }).length;
    }

    _getPrivateKey(chainID, path, opt) {
        if (chainID === null || chainID === undefined ||
            path === null || path === undefined) {
            throw new error.InvalidParameter("Missing required parameter!");
        }

        opt = opt || {};
        let password = opt.password || this._seed;

        if (!password) {
            logger.warn("Missing password when request private key!");
        }

        logger.info(`Getting private key for chain "${chainID}", path "${path}"...`);
        let chainkey = this._db.read(chainID);
        if (!chainkey) {
            logger.error(`Key for chain "${chainID}" not found!`);
            throw new error.NotFound(`Key for chain "${chainID}" not found!`);
        }

        if (!chainkey.keys.hasOwnProperty(path)) {
            logger.error(`Key for chain "${chainID}", path "${path}" not found!`);
            throw new error.NotFound(`Key for chain "${chainID}", path "${path}" not found!`);
        }

        let encrypted = chainkey.keys[path];

        let priv = this._decryptPrivateKey(encrypted, password);

        return Buffer.from(priv, 'hex');

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

    _encryptPrivateKey(priv, password) {

        let iv = wanUtil.randomString(16);
        let salt = wanUtil.randomString(64);

        let hashKey = wanUtil.hashSecret(password, salt, 8192, 32);

        let data = wanUtil.encrypt(Buffer.from(hashKey["hash"], 'hex'), iv, priv)

        return {
            "version" : 1,
            "iv" : iv,
            "salt" : salt,
            "n" : 8192,
            "ciphertext" : data
        }

    }

    _decryptPrivateKey(data, password) {

        if (typeof data !== 'object') {
            throw new error.InvalidParameter("Missing data");
        }

        if (!data.hasOwnProperty("version") || !data.hasOwnProperty("iv") ||
            !data.hasOwnProperty("salt") || !data.hasOwnProperty("n") ||
            !data.hasOwnProperty("ciphertext")) {
            throw new error.InvalidParameter("Invalid data");
        }

        //
        let hashKey = wanUtil.hashSecret(password, data.salt, data.n, 32);

        let priv = wanUtil.decrypt(Buffer.from(hashKey["hash"], 'hex'), data.iv, data.ciphertext);

        return priv;
    }
}

module.exports = RawKeyWallet;

/* eof */

