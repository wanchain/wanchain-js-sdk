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

const keythereum = require('keythereum');

const logger = wanUtil.getLogger("keystore.js");

const _BIP44_PATH_LEN = 5;
const _CHAIN_GET_PUBKEY = {
    60   : wanUtil.sec256k1PrivToPub,  // ETH
    5718350   : wanUtil.sec256k1PrivToPub  // WAN
}; 

const _CHAINID_WAN = 5718350;

//const _SUPPORT_CHAINS = [ 0x8057414e, 0x8000003c ]; // WAN/ETH only
//
//const _CIPHER_IV_MSG = "keystoreWallet@wanchain";

/**
 * private key wallet implementation.
 * This provides a software wallet. And all HD wallet should follow it's API
 */
class KeyStoreWallet extends HDWallet {
    /**
     */
    constructor(seed) {
        // supports get pubkey, privkey
        super(WID.WALLET_CAPABILITY_GET_PUBKEY|WID.WALLET_CAPABILITY_GET_PRIVATEKEY|WID.WALLET_CAPABILITY_IMPORT_KEY_STORE|WID.WALLET_CAPABILITY_EXPORT_KEYSTORE);
        this._db   = global.hdWalletDB.getKeyStoreTable();
        this._seed = seed;
    } 

    /**
     * Identity number 
     */
    static id() {
        return WID.WALLET_ID_KEYSTORE;
    }

    static name () {
        return WID.toString(KeyStoreWallet.id());
    }

    /**
     */
    open() {
        logger.info("%s opened.", KeyStoreWallet.name());
        return true;
    }

    /**
     */
    close() {
        logger.info("%s closed.", KeyStoreWallet.name());
        return true;
    }

    /**
     */
    healthCheck() {
        return true;
    }

    /**
     */
    getPublicKey(path, opt) {
        logger.info("Getting public key for path %s...", path);
        let p = wanUtil.splitBip44Path(path);
        if (p.length != _BIP44_PATH_LEN) {
            logger.error(`Invalid path: ${path}`);
            throw new error.InvalidParameter(`Invalid path: ${path}`);
        }

        let chainID = p[1];
        if (chainID > 0x80000000) {
            // Hardened derivation
            chainID -= 0x80000000;
        }

        if (!_CHAIN_GET_PUBKEY.hasOwnProperty(chainID)) {
            logger.error(`Chain ${chainID} does not support to get public key!`);
            throw new error.NotSupport(`Chain ${chainID} does not support to get public key!`);
        }
        let getPubKey = _CHAIN_GET_PUBKEY[chainID];
       
        let ret = getPubKey(this._getPrivateKey(chainID, p[2], p[3], p[4], opt)); 

        logger.info("Getting public key for path %s is completed.", path);

        return ret;
    }

    /**
     */
    getPrivateKey(path, opt) {
        logger.info("Getting private key for path %s...", path);

        let p = wanUtil.splitBip44Path(path);
        if (p.length != _BIP44_PATH_LEN) {
            logger.error(`Invalid path: ${path}`);
            throw new error.InvalidParameter(`Invalid path: ${path}`);
        }

        let chainID = p[1];
        if (chainID > 0x80000000) {
            // Hardened derivation
            chainID -= 0x80000000;
        }

        let ret =  this._getPrivateKey(chainID, p[2], p[3], p[4], opt);
        logger.info("Getting private key for path %s is completed.", path);
        return ret;
    }

    /**
     */
    importKeyStore(path, keystore, opt) {
        logger.info("Importing keystore...");
        let p = wanUtil.splitBip44Path(path);
        if (p.length != _BIP44_PATH_LEN) {
            logger.error(`Invalid path: ${path}.`);
            throw new error.InvalidParameter(`Invalid path: ${path}.`);
        }

        opt = opt || {};
        let password = opt.password || this._seed;
        if (!opt.password) {
            logger.warn("Missing password when importing keystore!");
        }

        let chainID = p[1];
        if (chainID > 0x80000000) {
            // Hardened derivation
            chainID -= 0x80000000;
        }

        //let index = p[4];
        logger.info("chainID=%d.", chainID);
        if (!_CHAIN_GET_PUBKEY.hasOwnProperty(chainID)) {
            logger.error(`Chain ${chainID} does not support!`);
            throw new error.NotSupport(`Chain ${chainID} does not support!`);
        }

        try {
            JSON.parse(keystore);
        } catch(err) {
            logger.error(`Invalid keystore: ${err}`);
            throw new error.InvalidParameter(`Invalid keystore: ${err}`);
        }

        let chainkey = this._db.read(chainID);
        if (!chainkey) {
            logger.info("Chain not exist for chainID=%d, insert new one.", chainID);
            chainkey = {
                "chainID" : chainID,
                "count" : 1,
                "keystore" : {
                    0 : keystore 
                }
            }

            this._db.insert(chainkey);
            logger.info("Import keystore completed!");
            return;
        }

        let index = chainkey.count;
        if (chainkey.keystore.hasOwnProperty(index)) {
            logger.error(`Illogic, data corrupt: chainID=${chainID}, index=${index}!`);
            throw new error.LogicError(`Illogic, data corrupt: chainID=${chainID}, index=${index}!`);
        }
        chainkey.count = index + 1;
        chainkey.keystore[index] = keystore;

        this._db.update(chainID, chainkey);
        logger.info("Import keystore completed!");
    }

    /**
     */
    exportKeyStore(path) {
        logger.info("Exporting keystore...");
        let p = wanUtil.splitBip44Path(path);
        if (p.length != _BIP44_PATH_LEN) {
            logger.error(`Invalid path: ${path}.`);
            throw new error.InvalidParameter(`Invalid path: ${path}.`);
        }

        let chainID = p[1];
        if (chainID > 0x80000000) {
            // Hardened derivation
            chainID -= 0x80000000;
        }

        let index = p[4];
        let chainkey = this._db.read(chainID);
        if (!chainkey) {
            logger.error(`Chain ${chainID} not exist!`);
            throw new error.NotSupport(`Chain ${chainID} not exist!`);
        }

        if (!chainkey.keystore.hasOwnProperty(index)) {
            logger.error(`Keystore for chain ${chainID}, index ${index} not found!`);
            throw new error.NotFound(`Keystore for chain ${chainID}, index ${index} not found!`);
        }

        logger.info("Export keystore completed!");

        return chainkey.keystore[index];
    }

    /**
     */
    size(chainID) {
        let chainkey = this._db.read(chainID);
        if (!chainkey) {
            return 0;
        }

        return chainkey.count;
    }

    /**
     */
    _getPrivateKey(chainID, account, internal, index, opt) {
        if (chainID === null || chainID === undefined ||
            index === null || index === undefined) {
            throw new error.InvalidParameter("Missing required parameter!");
        }

        opt = opt || {};
        let forcechk = opt.forcechk || false;
        let password = opt.password || this._seed;

        if (forcechk && !opt.password) {
            logger.error("Missing password when requesting private key!");
            throw new error.InvalidParameter("Missing password when requesting private key!");
        }

        if (!opt.password) {
            logger.warn("Missing password when requesting private key!");
        }

        logger.info(`Getting private key for chain ${chainID}, index '${index}'...`);
        let chainkey = this._db.read(chainID);
        if (!chainkey) {
            logger.error(`Keystore for chain ${chainID} not found!`);
            throw new error.NotFound(`Keystore for chain ${chainID} not found!`);
        }

        if (!chainkey.keystore.hasOwnProperty(index)) {
            logger.error(`Keystore for chain ${chainID}, index ${index} not found!`);
            throw new error.NotFound(`Keystore for chain ${chainID}, index ${index} not found!`);
        }

        let keystore = chainkey.keystore[index];

        try {
            let ks = JSON.parse(keystore);
            let priv;
            if (chainID == _CHAINID_WAN) {
                if (internal) {
                    // For WAN, to get private address
                    priv = keythereum.recover(password, {
                                              version: ks.version,
                                              crypto: ks.crypto2
                                             });
                } else {
                    priv = keythereum.recover(password, {
                                              version: ks.version,
                                              crypto: ks.crypto
                                             });
                }
            } else {
                priv = keythereum.recover(password, {
                                          version: ks.version,
                                          crypto: ks.crypto
                                         });
            }
            

            return priv;
        } catch (err) {
            logger.error(`Caught error when recovering private key for chain:${chainID}, index:${index}! ${err}`);
            throw err;
        }
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

module.exports = KeyStoreWallet;

/* eof */

