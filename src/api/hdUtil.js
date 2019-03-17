/**
 * HD wallet APIs
 *
 * Copyright (c) Wanchain, all rights reserved
 */
'use strict'

const crypto   = require('crypto');
const Mnemonic = require('bitcore-mnemonic');
const unorm    = require('unorm');

const config   = require('../conf/config');

let ChainMgr = require("../hdwallet/chainmanager");


const cipherAlgoAES256Cbc = 'aes-256-cbc';
const cipherDefaultIVMsg  = 'AwesomeWanchain!';

/**
 * hdUtil
 */
const hdUtil = {
    /**
     * Create hash
     *
     * @param {msg} - the message to hash
     * @param {algo} - the HASH algorithm to use
     * @returns {string} - digest of hashed message
     */
    createHash(msg, algo) {
       algo = algo || 'sha256';

       return crypto
          .createHash(algo)
          .update(msg)
          .digest();
    },

    keyDerivationPBKDF2(msg, dklen) {
        let msgBuf = unorm.nfkd(msg);
        let saltBuf = unorm.nfkd(cipherDefaultIVMsg);
        return crypto.pbkdf2Sync(msgBuf, saltBuf, 2048, dklen, 'sha512');
    },

    /**
     * Encrypt method
     *
     * @param {key} - The raw key for cipher algorithm, the length is different from algo:
     *                Algorithm   Key                iv
     *                aes128      16 byte (128 bits) 16 byte (128 bits)
     *                aes-128-cbc 16 byte (128 bits) 16 byte (128 bits)
     *                aes192      24 byte (192 bits) 16 byte (128 bits)
     *                aes256      32 byte (256 bits) 16 byte (128 bits) 
     * @param {iv} - Initialize vector, 16 bits length   
     * @param {data} - data to be encrypted   
     * @returns string - encrypted string
     */
    encrypt(key, iv, data) {
        let cipher = crypto.createCipheriv(cipherAlgoAES256Cbc, key, iv);
        let crypted = cipher.update(data, 'utf8', 'binary');
        crypted += cipher.final('binary');
        crypted = new Buffer(crypted, 'binary').toString('base64');
        return crypted;
    },
     
    /**
     * Decrypt method
     *
     * @param {key} - The raw key for decipher algorithm, the length is different from algo, refer encrypt for detail.
     * @param {iv} - Initialized vector     
     * @param {crypted} - the crypted data to be decrypted
     * @returns {string} - decrypted string
     */
    decrypt(key, iv, crypted) {
        crypted = new Buffer(crypted, 'base64').toString('binary');
        let decipher = crypto.createDecipheriv(cipherAlgoAES256Cbc, key, iv);
        let decoded = decipher.update(crypted, 'binary', 'utf8');
        decoded += decipher.final('utf8');
        return decoded;
    },

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

        //let code = new Mnemonic(strength, Mnemonic.Words.CHINESE);
        let code = new Mnemonic(strength);

        // IV size of 16 bytes
        //let resizedIV = Buffer.allocUnsafe(16);
        //let iv = this.createHash(cipherDefaultIVMsg);
        //iv.copy(resizedIV);
        let iv = this.keyDerivationPBKDF2(cipherDefaultIVMsg, 16);

        // Key is 32 bytes for aes-256-cbc
        //let key = this.createHash(password);
        let key = this.keyDerivationPBKDF2(password, 32);

        let encryptedCode = this.encrypt(key, iv, code.toString());

        let record = {
            'id' : 1,  // Only support one mnemonic, so always set ID to 1
            'mnemonic' : encryptedCode,
            'exported' : false
        };

        global.hdWalletDB.addMnemonic(record);

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
        let iv = this.keyDerivationPBKDF2(cipherDefaultIVMsg, 16);

        // Key is 32 bytes for aes-256-cbc
        //let key = this.createHash(password);
        let key = this.keyDerivationPBKDF2(password, 32);
        let code = this.decrypt(key, iv, encryptedCode);

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
        if (!password) {
            throw new Error("Missing password");
        }

        let record = global.hdWalletDB.getMnemonic(1);
        if (!record) {
             // Record not found
             return false;
        }

        try {
            let encryptedCode = record['mnemonic'];

            let iv = this.keyDerivationPBKDF2(cipherDefaultIVMsg, 16);

            let key = this.keyDerivationPBKDF2(password, 32);
            let code = this.decrypt(key, iv, encryptedCode);
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
