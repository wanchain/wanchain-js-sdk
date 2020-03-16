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
        super(WID.WALLET_CAPABILITY_GET_PUBKEY|WID.WALLET_CAPABILITY_GET_PRIVATEKEY|WID.WALLET_CAPABILITY_IMPORT_KEY_STORE|WID.WALLET_CAPABILITY_EXPORT_KEYSTORE|WID.WALLET_CAPABILITY_GET_ADDRESS);
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
            logger.error(`Invalid path: "${path}"`);
            throw new error.InvalidParameter(`Invalid path: "${path}"`);
        }

        let chainID = p[1];
        if (chainID >= 0x80000000) {
            // Hardened derivation
            chainID -= 0x80000000;
        }

        if (!_CHAIN_GET_PUBKEY.hasOwnProperty(chainID)) {
            logger.error(`Chain "${chainID}" does not support to get public key!`);
            throw new error.NotSupport(`Chain "${chainID}" does not support to get public key!`);
        }
        let getPubKey = _CHAIN_GET_PUBKEY[chainID];

        opt = opt || { "forcechk" : false, "password" : this._seed }

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
            logger.error(`Invalid path: "${path}"`);
            throw new error.InvalidParameter(`Invalid path: "${path}"`);
        }

        let chainID = p[1];
        if (chainID >= 0x80000000) {
            // Hardened derivation
            chainID -= 0x80000000;
        }

        let ret =  this._getPrivateKey(chainID, p[2], p[3], p[4], opt);
        logger.info("Getting private key for path %s is completed.", path);
        return ret;
    }

    /**
     */
    getAddress(path, opt) {
        logger.info("Getting address for path %s...", path);

        opt = opt || {};

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

        let index = p[4];
        let chainkey = this._db.read(chainID);
        if (!chainkey) {
            logger.error(`Chain "${chainID}" not exist!`);
            throw new error.NotSupport(`Chain "${chainID}" not exist!`);
        }

        if (!chainkey.keystore.hasOwnProperty(index)) {
            logger.error(`Keystore for chain "${chainID}", index "${index}" not found!`);
            throw new error.NotFound(`Keystore for chain "${chainID}", index "${index}" not found!`);
        }

        let keystore = chainkey.keystore[index];

        let addr = {
            "address" : keystore.address
        };
        if (opt.includeWaddress && chainID == _CHAINID_WAN ) {
            addr.waddress = keystore.waddress;
        }

        logger.info("Getting address for path %s is completed.", path);

        return addr;
    }

    /**
     * Import keystore into wallet
     *
     * @param {opt} object -
     *     {
     *          "oldPassword" : string
     *          "newPassword" : string
     *     }
     */
    importKeyStore(path, keystore, opt) {
        logger.info("Importing keystore...");
        let p = wanUtil.splitBip44Path(path);
        if (p.length != _BIP44_PATH_LEN) {
            logger.error(`Invalid path: "${path}".`);
            throw new error.InvalidParameter(`Invalid path: "${path}".`);
        }

        let chainID = p[1];
        if (chainID >= 0x80000000) {
            // Hardened derivation
            chainID -= 0x80000000;
        }

        //let index = p[4];
        logger.info("chainID=%d.", chainID);
        if (!_CHAIN_GET_PUBKEY.hasOwnProperty(chainID)) {
            logger.error(`Chain "${chainID}" does not support!`);
            throw new error.NotSupport(`Chain "${chainID}" does not support!`);
        }

        let ksobj;
        try {
            ksobj = JSON.parse(keystore);
        } catch(err) {
            logger.error("Invalid keystore: %s", err);
            throw new error.InvalidParameter(`Invalid keystore: "${err}"`);
        }

        if (opt.checkDuplicate) {
            //
            if (!ksobj.hasOwnProperty("address")) {
                //
                logger.error("Invalid keystore: missing address");
                throw new error.InvalidParameter(`Invalid keystore: missing address`);
            }
            let chns = this._db.read(chainID);
            if (chns) {
                for (let i=0; i<chns.count; i++) {
                    if (!chns.keystore.hasOwnProperty(i)) {
                        continue
                    }

                    let ks = chns.keystore[i];
                    if (ks.address == ksobj.address.toLowerCase()) {
                        logger.error("Duplicate record found!");
                        throw new error.InvalidParameter(`Duplicate record found`);
                    }
                }
            }
        }

        if (opt.oldPassword) {
            logger.info("Change keystore with new password.")

            let password = opt.newPassword || this._seed;

            if (!opt.chkfunc) {
                logger.error("Missing check function when re-encrypt keystore!");
                throw new error.InvalidParameter("Missing check function when re-encrypt keystore!");
            }

            if (!opt.newPassword) {
                logger.warn("Do not provide password when re-encrypt keystore!");
            }

            if (!opt.chkfunc(password)) {
                logger.error("Encrypt keystore check failed!");
                throw new error.WrongPassword("Encrypt keystore check failed!");
            }

            keystore = this._changeKeyStore(keystore, chainID, opt.oldPassword, password);
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
            return 0;
        }

        let index;
        let indexes = [...new Set(Object.keys(chainkey.keystore))];
        if (indexes.length === 0) {
            index = '0';
        } else {
            for (let i = 0; ; i ++) {
                if (!indexes.includes(i.toString())) {
                    index = i.toString();
                    break;
                }
            }
        }

        if (chainkey.keystore.hasOwnProperty(index)) {
            logger.error(`Illogic, data corrupt: chainID="${chainID}", index="${index}"!`);
            throw new error.LogicError(`Illogic, data corrupt: chainID="${chainID}", index="${index}"!`);
        }
        chainkey.count++;
        chainkey.keystore[index] = keystore;

        this._db.update(chainID, chainkey);
        logger.info("Import keystore completed!");

        return index;
    }

    /**
     */
    exportKeyStore(path) {
        logger.info("Exporting keystore...");
        let p = wanUtil.splitBip44Path(path);
        if (p.length != _BIP44_PATH_LEN) {
            logger.error(`Invalid path: "${path}".`);
            throw new error.InvalidParameter(`Invalid path: "${path}".`);
        }

        let chainID = p[1];
        if (chainID >= 0x80000000) {
            // Hardened derivation
            chainID -= 0x80000000;
        }

        let index = p[4];
        let chainkey = this._db.read(chainID);
        if (!chainkey) {
            logger.error(`Chain "${chainID}" not exist!`);
            throw new error.NotSupport(`Chain "${chainID}" not exist!`);
        }

        if (!chainkey.keystore.hasOwnProperty(index)) {
            logger.error(`Keystore for chain "${chainID}", index "${index}" not found!`);
            throw new error.NotFound(`Keystore for chain "${chainID}", index "${index}" not found!`);
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
        let password = opt.password || this._seed;

        if (!opt.password) {
            logger.warn("Missing password when requesting private key!");
        }

        logger.info(`Getting private key for chain "${chainID}", index "${index}"...`);
        let chainkey = this._db.read(chainID);
        if (!chainkey) {
            logger.error(`Keystore for chain "${chainID}" not found!`);
            throw new error.NotFound(`Keystore for chain "${chainID}" not found!`);
        }

        if (!chainkey.keystore.hasOwnProperty(index)) {
            logger.error(`Keystore for chain "${chainID}", index "${index}" not found!`);
            throw new error.NotFound(`Keystore for chain "${chainID}", index "${index}" not found!`);
        }

        let keystore = chainkey.keystore[index];

        try {
            let ks = typeof keystore === 'string' ? JSON.parse(keystore) : keystore;
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
            logger.error(`Caught error when recovering private key for chain:"${chainID}", index:"${index}"! "${err}"`);
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

    _changeKeyStore(keystore, chainID, oldPassword, newPassword) {
        logger.debug("Change keystore with new password...");

        if (typeof oldPassword !== 'string' || !oldPassword ||
            typeof newPassword !== 'string' || !newPassword) {
            throw new error.InvalidParameter("Missing old/new password!");
        }

        // decode keystore to get private key
        let ks = JSON.parse(keystore);

        let priv1 = keythereum.recover(oldPassword, {
                                           version: ks.version,
                                           crypto: ks.crypto
                                       });

        let params = { keyBytes: 32, ivBytes: 16 };
        let options = {
            kdf: "scrypt",
            cipher: "aes-128-ctr",
            kdfparams: {
                n: 8192,
                dklen: 32,
                prf: "hmac-sha256"
            }
        };

        let dk = keythereum.create(params);
        let keyObject = keythereum.dump(newPassword, priv1, dk.salt, dk.iv, options);

        if (chainID == _CHAINID_WAN) {
            let priv2 = keythereum.recover(oldPassword, {
                                               version: ks.version,
                                               crypto: ks.crypto2
                                           });
            let dk2 = keythereum.create(params);
            let keyObject2 = keythereum.dump(newPassword, priv2, dk2.salt, dk2.iv, options);

            keyObject.crypto2 = keyObject2.crypto;

            keyObject.waddress = ks.waddress;
        }

        logger.debug("Change keystore with new password is completed.");

        return keyObject;
    }
}

module.exports = KeyStoreWallet;

/* eof */

