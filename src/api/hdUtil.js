/**
 * HD wallet APIs
 * 
 * Copyright (c) 2019 Wanchain.
 * It can be freely distrubuted under MIT license.
 */
'use strict'

const crypto   = require('crypto');
const Mnemonic = require('bitcore-mnemonic');
const unorm    = require('unorm');

const wanUtil  = require('../util/util');
const WID = require("../hdwallet/wallets/walletids");

let ChainMgr = require("../hdwallet/chainmanager");

const cipherDefaultIVMsg  = 'AwesomeWanchain!';

let logger = wanUtil.getLogger("hdutil.js");
/**
 * hdUtil
 */
const hdUtil = {
    /**
     * Check to see if we already has mnemonic in system
     *
     * @returns {bool} - true if has, otherwise false
     */
    hasMnemonic() {
        return global.hdWalletDB.getMnemonicTable().size() > 0;
    },

    /**
     * Generate mnemonic
     *
     * @param {password} - mandantory
     * @param {strength} - Entropy size, defaults to 128
     * @returns {string} - mnemonic
     */
    generateMnemonic(password, strength) {
        strength = strength || 128;

        logger.debug("Generating mnemonic with strength=%d...", strength);

        //let code = new Mnemonic(strength, Mnemonic.Words.CHINESE);
        let code = new Mnemonic(strength);

        // IV size of 16 bytes
        //let resizedIV = Buffer.allocUnsafe(16);
        //let iv = this.createHash(cipherDefaultIVMsg);
        //iv.copy(resizedIV);
        let iv = wanUtil.keyDerivationPBKDF2(cipherDefaultIVMsg, 16);

        // Key is 32 bytes for aes-256-cbc
        //let key = this.createHash(password);
        let key = wanUtil.keyDerivationPBKDF2(password, 32);

        let encryptedCode = wanUtil.encrypt(key, iv, code.toString());

        let record = {
            'id' : 1,  // Only support one mnemonic, so always set ID to 1
            'mnemonic' : encryptedCode,
            'exported' : false
        };

        global.hdWalletDB.getMnemonicTable().insert(record);

        logger.debug("Generate mnemonic is completed");

        return code.toString();
    },

    /**
     * Reveal mnemonic
     *
     * @param {password} - mandantory 
     * @returns {string} - mnemonic stored in wallet
     */
    revealMnemonic(password) {
        // Only support 1 mnemonic
        let record = global.hdWalletDB.getMnemonicTable().read(1);
        if (!record) {
            throw new Error("No mnemonic exist");
        }

        let encryptedCode = record['mnemonic'];

        // IV size of 16 bytes
        //let resizedIV = Buffer.allocUnsafe(16);
        //let iv = this.createHash(cipherDefaultIVMsg);
        //iv.copy(resizedIV);
        let iv = wanUtil.keyDerivationPBKDF2(cipherDefaultIVMsg, 16);

        // Key is 32 bytes for aes-256-cbc
        //let key = this.createHash(password);
        let key = wanUtil.keyDerivationPBKDF2(password, 32);
        let code = wanUtil.decrypt(key, iv, encryptedCode);

        record['exported'] = true;
        global.hdWalletDB.getMnemonicTable().update(1, record);

        return code;
    },

    /**
     * Delete existing mnemonic
     *
     * @param {password} - password for mnemonic to delete
     * @returns {bool} - true if success, false if not found
     */
    deleteMnemonic(password) {
        logger.info("Deleting mnemonic...");
        if (!password) {
            throw new Error("Missing password");
        }

        let record = global.hdWalletDB.getMnemonicTable().read(1);
        if (!record) {
             // Record not found
             logger.info("Mnemonic not found, id = 1");
             return false;
        }

        try {
            let encryptedCode = record['mnemonic'];

            let iv = wanUtil.keyDerivationPBKDF2(cipherDefaultIVMsg, 16);

            let key = wanUtil.keyDerivationPBKDF2(password, 32);
            let code = wanUtil.decrypt(key, iv, encryptedCode);
        } catch (e) {
            throw new Error("Invalid password");
        }

        global.hdWalletDB.getMnemonicTable().delete(1);

        return true;
    },

    /**
     * Check if input word list is valid mnemonic
     *
     * @param {mnemonic} - input mnemonic to be checked
     * @returns {boolean} - ture if valid, false otherwise 
     */
    validateMnemonic(mnemonic) {
        return Mnemonic.isValid(mnemonic);
    },

    /**
     * Initialize HD wallet
     * User must call this function before use HD wallet
     *
     * @param {mnemonic} - mnemonic code to use as seed for key derivation
     */
    initializeHDWallet(mnemonic) {
        if (!this.validateMnemonic(mnemonic)) {
            throw new Error("Invalid mnemonic");
        }

        global.chainManager.newNativeWallet(mnemonic);
        logger.info("Initialize HD wallet with mnemonic done.");
    },

    /**
     */
    deleteHDWallet() {
        logger.warn("About to delete HD wallet...");
        let safe = global.chainManager.getWalletSafe();
        safe.deleteNativeWallet();
        logger.warn("Delete HD wallet completed.");
    },

    /**
     */
    async connectToLedger() {
        logger.info("About to connect Ledger wallet...");
        let safe = global.chainManager.getWalletSafe();
        await safe.newLedgerWallet();
        logger.info("Ledger wallet connected.");
    },

    /**
     */
    async disconnectLedger() {
        logger.info("About to disconnect Ledger wallet...");
        let safe = global.chainManager.getWalletSafe();
        await safe.deleteLedgerWallet();
        logger.info("Ledger wallet disconnected.");
    },

    /**
     */
    newRawKeyWallet(seed) {
        logger.info("Creating raw key wallet...");
        let safe = global.chainManager.getWalletSafe();
        safe.newRawKeyWallet(seed);
        logger.info("Creating raw key wallet connected.");
    },

    /**
     */
    deleteRawKeyWallet() {
        logger.warn("About to delete raw key wallet...");
        let safe = global.chainManager.getWalletSafe();
        safe.deleteRawKeyWallet();
        logger.warn("Delete raw key wallet completed.");
    },

    /**
     */
    newKeyStoreWallet(seed) {
        logger.info("Creating keystore wallet...");
        let safe = global.chainManager.getWalletSafe();
        safe.newKeyStoreWallet(seed);
        logger.info("Creating raw key wallet connected.");
    },

    /**
     */
    deleteKeyStoreWallet() {
        logger.warn("About to delete keystore wallet...");
        let safe = global.chainManager.getWalletSafe();
        safe.deleteKeyStoreWallet();
        logger.warn("Delete keystore wallet completed.");
    },

    /**
     */
    getRawKeyCount(chainID) {
        if (chainID === null || chainID === undefined) {
            throw new Error("Missing required parameter!");
        }

        let w = this.getWalletSafe().getWallet(WID.WALLET_ID_RAWKEY);
        if (!w) {
            throw new Error("Raw key wallet not opened!");
        }

        return w.size(chainID);
    },


    /**
     */
    importPrivateKey(path, privateKey, password) {
        if (path === null || path === undefined ||
            !Buffer.isBuffer(privateKey)) {
            throw new Error("Missing required parameter!");
        }

        let opt = {};

        if (password) {
            opt.password = password;
        }

        let w = this.getWalletSafe().getWallet(WID.WALLET_ID_RAWKEY);
        if (!w) {
            throw new Error("Raw key wallet not opened!");
        }

        w.importPrivateKey(path, privateKey, opt);
    },

    /**
     */
    importKeyStore(path, keystore, password) {
        if (path === null || path === undefined ||
            typeof keystore !== 'string') {
            throw new Error("Missing required parameter!");
        }

        try {
            JSON.parse(keystore);
        } catch(err) {
            throw new Error(`Invalid keystore: ${err}`);
        }

        let opt = {};

        if (password) {
            opt.password = password;
        }

        let w = this.getWalletSafe().getWallet(WID.WALLET_ID_KEYSTORE);
        if (!w) {
            throw new Error("Key store wallet not opened!");
        }

        w.importKeyStore(path, keystore, opt);
    },

    /**
     */
    exportPrivateKey(wid, path, password) {
        if (typeof wid !== 'number' ||
            typeof path !== 'string' ||
            typeof password !== 'string') {
            throw new Error("Missing required parameter!");
        }

        let w = this.getWalletSafe().getWallet(wid);
        if (!w) {
            throw new Error("Wallet not found!");
        }

        if (!w.isSupportGetPrivateKey()) {
            throw new Error("Wallet doesn't support get private key!");
        }

        let opt = new WID.WalletOpt(password, true, this.revealMnemonic);

        let priv = w.getPrivateKey(path, opt);

        return priv.toString('hex');
    },


    exportKeyStore(wid, path, password) {
        if (typeof wid !== 'number' ||
            typeof path !== 'string' ||
            typeof password !== 'string') {
            throw new Error("Missing required parameter!");
        }

        let w = this.getWalletSafe().getWallet(wid);
        if (!w) {
            throw new Error("Wallet not found!");
        }

        if (w.isSupportExportKeyStore()) {
            return w.exportKeyStore(path);
        }

        throw new Error("Not support");
        //if (!w.isSupportGetPrivateKey()) {
        //    throw new Error("Wallet doesn't support get private key!");
        //}

        //let opt = new WID.WalletOpt(password, true, this.revealMnemonic);
    },

    /**
     */
    getWalletSafe() {
        return global.chainManager.getWalletSafe();
    },

    /**
     * Get address for specified chain
     *
     * @param {wid} number - wallet ID
     * @param {chain} string - chain name to get addresses
     * @param {startPath} number or string - start index when number, path when string
     * @param {end} number - end index (not include), only when startPath is number
     * @return {object}
     *   When startPath is number:
     *     {
     *         "start" : number,
     *         "addresses" : [
     *             addressInfo
     *         ]
     *     }
     *
     *     "start" -- the start index to scan, this may different from start in parameter, 
     *                as wallet try to start from last known used index.
     *     "addressInfo" -- refer discoverAddress
     *   When startPath is string:
     *     {
     *       "path" : string,
     *       "pubKey" : string,
     *       "address" : string
     *     }
     *
     */
    async getAddress(wid, chain, startPath, end) {
        let chnmgr = global.chainManager;
        if (!chnmgr) {
            throw new Error("Illogic, chain manager not initialized");
        }

        logger.debug(`Get address from ${startPath} for ${chain} in wallet ${wid}`);
        let chn = chnmgr.getChain(chain.toUpperCase());
        if (!chn) {
            throw new Error(`Not support: chain=${chain}`);
        }

        return chn.getAddress(wid, startPath, end);
    } ,

    /**
     * Get registered chain names in HD wallet
     *
     * @returns {Array} - array of names of registered chains
     */
    getRegisteredChains() {
        let chnmgr = global.chainManager;
        if (!chnmgr) {
            throw new Error("Illogic, chain manager not initialized");
        }

        return chnmgr.getRegisteredChains();
    }
}
module.exports = hdUtil;
