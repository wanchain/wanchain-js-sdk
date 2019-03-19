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
        return global.hdWalletDB.hasMnemonic();
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

        global.hdWalletDB.addMnemonic(record);

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
        let record = global.hdWalletDB.getMnemonic(1);
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
        global.hdWalletDB.updateMnemonic(1, record);

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

        let record = global.hdWalletDB.getMnemonic(1);
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

        global.hdWalletDB.deleteMnemonic(1);

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

        global.chainManager = ChainMgr.NewManager(mnemonic, global.hdWalletDB);
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
