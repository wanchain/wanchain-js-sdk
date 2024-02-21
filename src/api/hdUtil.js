/**
 * HD wallet APIs
 *
 * Copyright (c) 2019 Wanchain.
 * It can be freely distrubuted under MIT license.
 */
'use strict'

const crypto = require('crypto');
const Mnemonic = require('bitcore-mnemonic');
const unorm = require('unorm');

const wanUtil = require('../util/util');
const WID = require("../hdwallet/wallets/walletids");

const error = require('./error.js');

let ChainMgr = require("../hdwallet/chainmanager");

let logger = wanUtil.getLogger("hdutil.js");

/**
 * @param {key} : buffer, length must greater than 32.
 * @param {msg} : buffer
 * @returns {buffer}
 */
function getMac(key, msg) {
    if (!Buffer.isBuffer(key) || !Buffer.isBuffer(msg)) {
        throw new error.InvalidParameter("Invalid paramter: key/msg!");
    }

    let buf = Buffer.concat([key.slice(16, 32), msg]);
    return wanUtil.createHash(buf);
}

function encryptMnemonic(mnemonic, password) {
    if (typeof mnemonic !== 'string' || !mnemonic ||
        typeof password !== 'string' || !password) {
        throw new error.InvalidParameter("Invalid parameters");
    }

    let iv = wanUtil.randomString(16);
    let salt = wanUtil.randomString(64);

    let hashKey = wanUtil.hashSecret(password, salt, 32768, 32);

    let key = Buffer.from(hashKey["hash"], 'hex');

    let data = wanUtil.encrypt(key, iv, mnemonic);

    let mac = getMac(key, Buffer.from(data, 'base64'));

    let record = {
        'version': 1,
        'mnemonic': {
            'ciphertext': data,
            'iv': iv,
            'kdf': {
                'salt': salt,
                'n': hashKey.iterations,
                'dklen': hashKey.dklen
            },
            'mac': mac.toString('hex')
        }
    }

    return record;
};

function decryptMnemonic(record, password) {
    if (typeof record !== 'object' || !record.hasOwnProperty("version") ||
        !record.hasOwnProperty("mnemonic") || !record.mnemonic.hasOwnProperty("ciphertext") ||
        !record.mnemonic.hasOwnProperty("iv") || !record.mnemonic.hasOwnProperty("mac") ||
        !record.mnemonic.hasOwnProperty("kdf") || !record.mnemonic.kdf.hasOwnProperty("salt") ||
        !record.mnemonic.kdf.hasOwnProperty("n") || !record.mnemonic.kdf.hasOwnProperty("dklen")) {

        throw new error.InvalidParameter("Invalid mnemonic data");
    }

    let hashKey = wanUtil.hashSecret(password, record.mnemonic.kdf.salt,
        record.mnemonic.kdf.n, record.mnemonic.kdf.dklen);

    let key = Buffer.from(hashKey["hash"], 'hex');
    let mac = getMac(key, Buffer.from(record.mnemonic.ciphertext, 'base64'));

    if (mac.toString('hex') !== record.mnemonic.mac) {
        throw new error.WrongPassword("Invalid password");
    }

    let code;
    try {
        code = wanUtil.decrypt(key, record.mnemonic.iv, record.mnemonic.ciphertext);
    } catch (e) {
        throw new error.WrongPassword("Decrypt failed");
    }

    return code;
};

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
     * @param {saveToDB} - bool, default false
     * @returns {string} - mnemonic
     */
    generateMnemonic(password, strength, saveToDB = false) {
        strength = strength || 128;

        logger.debug("Generating mnemonic with strength=%d...", strength);

        //let code = new Mnemonic(strength, Mnemonic.Words.CHINESE);
        let code = new Mnemonic(strength);

        if (saveToDB) {

            let record = encryptMnemonic(code.toString(), password);
            record.id = 1; // Only support one mnemonic, so always set ID to 1

            global.hdWalletDB.getMnemonicTable().insert(record);
        }

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
            //throw new Error("No mnemonic exist");
            throw new error.NotFound("No mnemonic exist");
        }

        let code;
        try {
            code = decryptMnemonic(record, password);
        } catch (e) {
            logger.error('Caught exception when reveal mnemonic: ', e.message)
            throw e
        }


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
            //throw new Error("Missing password");
            throw new error.InvalidParameter("Missing password");
        }

        let record = global.hdWalletDB.getMnemonicTable().read(1);
        if (!record) {
            // Record not found
            //logger.info("Mnemonic not found, id = 1");
            throw new error.NotFound("Mnemonic not found, id = 1");
            return false;
        }

        try {
            decryptMnemonic(record, password);
        } catch (e) {
            logger.error('Caught exception when delete mnemonic: ', e.message)
            throw e
        }

        global.hdWalletDB.getMnemonicTable().delete(1);

        return true;
    },

    /**
     * Import mnemonic
     *
     * @param {mnemonic} - required
     * @param {password} - required
     * @returns {bool}
     */
    importMnemonic(mnemonic, password) {
        logger.debug("Importing mnemonic ...");

        if (!mnemonic || !password) {
            throw new error.InvalidParameter("Missing required parameter");
        }

        if (!this.validateMnemonic(mnemonic)) {
            throw new error.InvalidParameter("Invalid mnemonic");
        }

        let record = encryptMnemonic(mnemonic, password);
        record.id = 1; // Only support one mnemonic, so always set ID to 1

        global.hdWalletDB.getMnemonicTable().insert(record);

        logger.debug("Import mnemonic is completed");

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
            //throw new Error("Invalid mnemonic");
            throw new error.InvalidParameter("Invalid mnemonic");
        }

        global.chainManager.newNativeWallet(mnemonic);
        logger.info("Initialize HD wallet with mnemonic done.");
    },

    /**
     */
    async deleteHDWallet() {
        logger.warn("About to delete HD wallet...");
        let safe = global.chainManager.getWalletSafe();
        await safe.deleteNativeWallet();
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
    async deleteRawKeyWallet() {
        logger.warn("About to delete raw key wallet...");
        let safe = global.chainManager.getWalletSafe();
        await safe.deleteRawKeyWallet();
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
    async deleteKeyStoreWallet() {
        logger.warn("About to delete keystore wallet...");
        let safe = global.chainManager.getWalletSafe();
        await safe.deleteKeyStoreWallet();
        logger.warn("Delete keystore wallet completed.");
    },

    /**
     */
    getRawKeyCount(chainID, path) {
        if (chainID === null || chainID === undefined || path === null || path === undefined) {
            //throw new Error("Missing required parameter!");
            throw new error.InvalidParameter("Missing required parameter!");
        }

        let w = this.getWalletSafe().getWallet(WID.WALLET_ID_RAWKEY);
        if (!w) {
            //throw new Error("Raw key wallet not opened!");
            throw new error.NotFound("Raw key wallet not opened!");
        }

        return w.size(chainID, path);
    },

    getKeyStoreCount(chainID) {
        if (chainID === null || chainID === undefined) {
            //throw new Error("Missing required parameter!");
            throw new error.InvalidParameter("Missing required parameter!");
        }

        let w = this.getWalletSafe().getWallet(WID.WALLET_ID_KEYSTORE);
        if (!w) {
            //throw new Error("Raw key wallet not opened!");
            throw new error.NotFound("Raw key wallet not opened!");
        }

        return w.size(chainID);
    },

    /**
     * Get a new index of path to create new account.
     *
     * @param {chainID} - required
     * @param {pathForm} - required
     * @param {walletID} - required
     * @returns {index} - path index
     */
    getNewPathIndexByChainID(chainID, pathForm, walletID) {
        if (chainID === null || chainID === undefined) {
            throw new error.InvalidParameter("Missing required parameter!");
        }
        
        let usrTbl = global.hdWalletDB.getUserTable();
        let ainfo = usrTbl.read(chainID);
        if (!ainfo) {
            return 0;
        } else {
            let index;
            for (let i = 0; ; i ++) {
                if (!ainfo.accounts.hasOwnProperty(`${pathForm}${i}`)) {
                    index = i;
                    break;
                } else if (!ainfo.accounts[`${pathForm + i}`].hasOwnProperty(walletID)) {
                    index = i;
                    break;
                }
            }
            return index;
        }
    },

    /**
     * Get a new name for imported account
     * 
     * @param {chainID} - required
     * @param {prefix} - prefix of account name
     */
    getNewNameForImportedAccount(chainID, prefix='') {
        if (chainID === null || chainID === undefined) {
            throw new error.InvalidParameter("Missing required parameter!");
        }
        
        let usrTbl = global.hdWalletDB.getUserTable();
        let ainfo = usrTbl.read(chainID);
        if (!ainfo || Object.keys(ainfo.accounts).length === 0) {
            return `${prefix}1`;
        } else {
            let accounts = ainfo.accounts;
            let names = [];
            Object.values(accounts).forEach(v => {
                if (v.hasOwnProperty('5')) {
                    names.push(v['5'].name);
                }
                if (v.hasOwnProperty('6')) {
                    names.push(v['6'].name);
                }
            });
            names = [...new Set(names)];
            if (names.length === 0) {
                return `${prefix}1`;
            }
            let index;
            for (let i = 1; ; i ++) {
                if (!names.includes(`${prefix}${i}`)) {
                    index = i;
                    break;
                }
            }
            return `${prefix}${index}`;
        }
    },

    /**
     * Get a new name for native account
     * 
     * @param {chainID} - required
     * @param {prefix} - prefix of account name
     */
    getNewNameForNativeAccount(chainID, prefix='') {
        if (chainID === null || chainID === undefined) {
            throw new error.InvalidParameter("Missing required parameter!");
        }
        
        let usrTbl = global.hdWalletDB.getUserTable();
        let ainfo = usrTbl.read(chainID);
        if (!ainfo || Object.keys(ainfo.accounts).length === 0) {
            return `${prefix}1`;
        } else {
            let accounts = ainfo.accounts;
            let names = [];
            Object.values(accounts).forEach(v => {
                if (v.hasOwnProperty('1')) {
                    names.push(v['1'].name);
                }
            });
            names = [...new Set(names)];
            if (names.length === 0) {
                return `${prefix}1`;
            }
            let index;
            for (let i = 1; ; i ++) {
                if (!names.includes(`${prefix}${i}`)) {
                    index = i;
                    break;
                }
            }
            return `${prefix}${index}`;
        }
    },

    /**
     */
    importPrivateKey(path, privateKey, password) {
        if (path === null || path === undefined ||
            !Buffer.isBuffer(privateKey)) {
            //throw new Error("Missing required parameter!");
            throw new error.InvalidParameter("Missing required parameter!");
        }

        let opt = {};

        if (password) {
            opt.password = password;
        }

        let w = this.getWalletSafe().getWallet(WID.WALLET_ID_RAWKEY);
        if (!w) {
            //throw new Error("Raw key wallet not opened!");
            throw new error.NotFound("Raw key wallet not opened!");
        }

        return w.importPrivateKey(path, privateKey, opt);
    },

    /**
     */
    importKeyStore(path, keystore, oldPassword, newPassword, checkDuplicate) {
        if (path === null || path === undefined ||
            typeof keystore !== 'string') {
            throw new error.InvalidParameter("Missing required parameter!");
        }

        try {
            JSON.parse(keystore);
        } catch (err) {
            throw new error.InvalidParameter(`Invalid keystore: ${err}`);
        }

        let opt = {};

        if (oldPassword) {
            opt.forcechk = true;
            opt.chkfunc = this.revealMnemonic;
            opt.password = newPassword;

            opt.oldPassword = oldPassword;
            opt.newPassword = newPassword;
        }

        if (checkDuplicate) {
            opt.checkDuplicate = true;
        }

        let ksobj;
        try {
            ksobj = JSON.parse(keystore);
        } catch(err) {
            logger.error("Invalid keystore: %s", err);
            throw new error.InvalidParameter(`Invalid keystore: "${err}"`);
        }

        let p = wanUtil.splitBip44Path(path);
        const _BIP44_PATH_LEN = 5;
        if (p.length != _BIP44_PATH_LEN) {
            logger.error(`Invalid path: "${path}".`);
            throw new error.InvalidParameter(`Invalid path: "${path}".`);
        }

        let chainID = p[1];
        if (chainID >= 0x80000000) {
            chainID -= 0x80000000;
        }
        let isExist = this.checkIsExist(`0x${ksobj.address.toLowerCase()}`, chainID);
        if (isExist) {
            logger.error("Duplicate record found!");
            throw new error.InvalidParameter(`Duplicate record found`);
        }

        let w = this.getWalletSafe().getWallet(WID.WALLET_ID_KEYSTORE);
        if (!w) {
            throw new error.NotFound("Raw key wallet not opened!");
        }

        return w.importKeyStore(path, keystore, opt);
    },

    /**
     */
    exportPrivateKey(wid, path, password) {
        if (typeof wid !== 'number' ||
            typeof path !== 'string' ||
            typeof password !== 'string') {
            throw new error.InvalidParameter("Missing required parameter!");
        }

        let w = this.getWalletSafe().getWallet(wid);
        if (!w) {
            throw new error.NotFound("Raw key wallet not opened!");
        }

        if (!w.isSupportGetPrivateKey()) {
            throw new error.NotSupport("Wallet doesn't support get private key!");
        }

        let opt = new WID.WalletOpt(password, true, this.revealMnemonic);

        let priv = w.getPrivateKey(path, opt);

        return priv.toString('hex');
    },

    async exportPrivateKeys(wid, chain, path, opt) {
        let chn = global.chainManager.getChain(chain.toUpperCase());
        let privKeys = await chn.getPrivateKeys(wid, path, opt);
        return privKeys;
    },

    exportKeyStore(wid, path, password) {
        if (typeof wid !== 'number' ||
            typeof path !== 'string' ||
            typeof password !== 'string') {
            throw new error.InvalidParameter("Missing required parameter!");
        }

        let w = this.getWalletSafe().getWallet(wid);
        if (!w) {
            throw new error.NotFound("Raw key wallet not opened!");
        }

        if (w.isSupportExportKeyStore()) {
            return w.exportKeyStore(path);
        }

        throw new error.NotSupport("Not support!");
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

    getChain(chainType) {
        const ret = global.chainManager.getChain(chainType);
        return ret;
    },

    /**
     */
    getWallet(wid) {
        if (typeof wid !== 'number') {
            throw new error.InvalidParameter("Invalid wallet ID!");
        }
        return this.getWalletSafe().getWallet(wid);
    },

    /**
     */
    getWalletInfo(wid) {
        if (typeof wid !== 'number') {
            throw new error.InvalidParameter("Invalid wallet ID!");
        }
        return this.getWalletSafe().getWalletInfo(wid);
    },

    /**
     * Get address for specified chain
     *
     * @param {wid} number - wallet ID
     * @param {chain} string - chain name to get addresses
     * @param {startPath} number or string - start index when number, path when string
     * @param {endOpt} number or object - end index (not include), only when startPath is number
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
    async getAddress(wid, chain, startPath, endOpt, opt) {
        let chnmgr = global.chainManager;
        if (!chnmgr) {
            throw new error.LogicError("Illogic, chain manager not initialized");
        }

        logger.debug(`Get address from '${startPath}' for '${chain}' in wallet '${wid}'`);
        let chn = chnmgr.getChain(chain.toUpperCase());
        if (!chn) {
            throw new error.NotSupport(`Not support: chain='${chain}'`);
        }

        if (typeof startPath === 'string') {
            return chn.getAddress(wid, startPath, endOpt);
        } else {
            return chn.getAddress(wid, startPath, endOpt, null, null, opt);
        }
    },

    async getAddressByPrivateKey(wid, chain, privateKey) {
        let chnmgr = global.chainManager;
        if (!chnmgr) {
            throw new error.LogicError("Illogic, chain manager not initialized");
        }

        logger.debug(`Get address from private key for '${chain}' in wallet '${wid}'`);
        let chn = chnmgr.getChain(chain.toUpperCase());
        if (!chn) {
            throw new error.NotSupport(`Not support: chain='${chain}'`);
        }

        return chn.getAddressByPrivateKey(wid, chain, privateKey);
    },

    checkIsExist(address, chainID) {
        if (typeof address !== 'string' || typeof chainID !== 'number') {
            throw new error.InvalidParameter("Invalid parameter!")
        }

        try {
            let usrTbl = global.hdWalletDB.getUserTable();
            let ainfo = usrTbl.read(chainID);
            if (!ainfo) {
                return false;
            } else {
                if (Object.keys(ainfo.accounts).length > 0) {
                    for (let path in ainfo.accounts) {
                        for (let wid in ainfo.accounts[path]) {
                            let param = chainID === 194 ? 'publicKey' : 'addr';
                            if (ainfo.accounts[path][wid][param] === address) {
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        } catch (e) {
            return false;
        }
    },

    /**
     * Get registered chain names in HD wallet
     *
     * @returns {Array} - array of names of registered chains
     */
    getRegisteredChains() {
        let chnmgr = global.chainManager;
        if (!chnmgr) {
            throw new error.LogicError("Illogic, chain manager not initialized");
        }

        return chnmgr.getRegisteredChains();
    },

    /**
     */
    getUserTableVersion() {
        return global.hdWalletDB.getUserVersion();
    },

    /**
     */
    setUserTableVersion(newVersion) {
        if (typeof newVersion !== 'string') {
            throw new error.InvalidParameter("Invalid parameter!")
        }
        global.hdWalletDB.setUserVersion(newVersion);
    },

    /**
     * Create user account, this is just book keeping work
     *
     * @param {wid} number, wallet ID;
     * @param {path} string, BIP44 path
     * @param {attr} string/object/..., attribute of path
     * @returns {bool} - true for success
     */
    createUserAccount(wid, path, attr, chainId) {
        if (typeof wid !== 'number' || typeof path !== 'string' || typeof attr === 'undefined') {
            throw new error.InvalidParameter("Invalid parameter!")
        }

        let chainID = chainId || wanUtil.getChainIDFromBIP44Path(path);

        let usrTbl = global.hdWalletDB.getUserTable();
        let ainfo = usrTbl.read(chainID);
        if (!ainfo) {
            ainfo = {
                "chainID": chainID,
                "accounts": {
                    [path]: {
                        [wid]: attr
                    }
                }
            };

            usrTbl.insert(ainfo);
        } else {
            if (!ainfo.accounts.hasOwnProperty(path)) {
                ainfo.accounts[path] = {};
            }

            let p = ainfo.accounts[path];
            if (p.hasOwnProperty(wid)) {
                logger.info(`User account for "${wid}:${path}" already exist`);
                return false
            }

            p[wid] = attr;
            usrTbl.update(chainID, ainfo);
        }
        return true;
    },

    /**
     * Get user account info
     *
     * @param {wid} number, wallet ID;
     * @param {path} string, BIP44 path
     * @returns {} - account attr for specified path
     */
    getUserAccount(wid, path, chainId) {
        if (typeof wid !== 'number' || typeof path !== 'string') {
            throw new error.InvalidParameter("Invalid parameter!")
        }
        let chainID = chainId || wanUtil.getChainIDFromBIP44Path(path);
        let usrTbl = global.hdWalletDB.getUserTable();
        let ainfo = usrTbl.read(chainID);
        if (!ainfo || !ainfo.accounts.hasOwnProperty(path) || !ainfo.accounts[path].hasOwnProperty(wid)) {
            throw new error.NotFound(`User account for "${wid}:${path}" not found`);
        }
        return ainfo.accounts[path][wid];
    },

    /**
     * Update user account,
     *
     * @param {wid} number, wallet ID;
     * @param {path} string, BIP44 path
     * @param {attr} string, new account attribute
     * @returns {bool} - true for success
     */
    updateUserAccount(wid, path, attr, chainId) {
        if (typeof wid !== 'number' || typeof path !== 'string' || typeof attr === 'undefined') {
            throw new error.InvalidParameter("Invalid parameter!")
        }
        let chainID = chainId || wanUtil.getChainIDFromBIP44Path(path);
        let usrTbl = global.hdWalletDB.getUserTable();
        let ainfo = usrTbl.read(chainID);
        if (!ainfo) {
            logger.warn(`Update user account for "${path}" not defined!`);
            ainfo = {
                "chainID": chainID,
                "accounts": {
                    [path]: {
                        [wid]: attr
                    }
                }
            };
            usrTbl.insert(ainfo);
        } else {
            if (!ainfo.accounts.hasOwnProperty(path)) {
                logger.warn(`Update user account for "${path}" not defined!`);
                ainfo.accounts[path] = {};
            }

            if (!ainfo.accounts[path].hasOwnProperty(wid)) {
                logger.warn(`Update user account for "${wid}:${path}" not found!`);
            }

            ainfo.accounts[path][wid] = attr;
            usrTbl.update(chainID, ainfo);
        }
        return true;
    },

    /**
     * Delete user account,
     *
     * @param {wid} number, wallet ID;
     * @param {path} string, BIP44 path
     * @returns {bool} - true for success
     */
    deleteUserAccount(wid, path, chainId) {
        if (typeof wid !== 'number' || typeof path !== 'string') {
            throw new error.InvalidParameter("Invalid parameter!")
        }
        let chainID = chainId || wanUtil.getChainIDFromBIP44Path(path);
        let usrTbl = global.hdWalletDB.getUserTable();
        let ainfo = usrTbl.read(chainID);
        if (!ainfo) {
            logger.warn(`Delete user account for "${path}" not found!`)
            return false;
        }

        if (!ainfo.accounts.hasOwnProperty(path)) {
            logger.warn(`Delete user account for "${path}" not found!`);
            return false;
        }

        if (!ainfo.accounts[path].hasOwnProperty(wid)) {
            logger.warn(`Delete user account for "${wid}:${path}" not found!`);
            return false;
        }

        delete ainfo.accounts[path][wid];
        usrTbl.update(chainID, ainfo);
        return true;
    },

    /**
     * Delete raw key,
     *
     * @param {path} string, BIP44 path
     */
    deleteRawKey(path) {
        if (typeof path !== 'string') {
            throw new error.InvalidParameter("Invalid parameter!")
        }
        let chainID = wanUtil.getChainIDFromBIP44Path(path);
        let rkTbl = global.hdWalletDB.getRawKeyTable();
        let rinfo = rkTbl.read(chainID);
        if (!rinfo) {
            logger.warn(`Delete raw key for "${path}" not found!`)
            return false;
        }

        if (!rinfo.keys.hasOwnProperty(path)) {
            logger.warn(`Delete raw key for "${path}" not found!`);
            return false;
        }

        delete rinfo.keys[path];
        rkTbl.update(chainID, rinfo);
        return true;
    },

    /**
     * Delete key store,
     *
     * @param {path} string, BIP44 path
     */
    deleteKeyStore(path, address) {
        if (typeof path !== 'string') {
            throw new error.InvalidParameter("Invalid parameter!")
        }
        let chainID = wanUtil.getChainIDFromBIP44Path(path);
        let ksTbl = global.hdWalletDB.getKeyStoreTable();
        let kinfo = ksTbl.read(chainID);
        if (!kinfo) {
            logger.warn(`Delete key store for "${path}" not found!`)
            return false;
        }

        if (!kinfo.keystore || Object.keys(kinfo.keystore) === 0) {
            logger.warn(`Delete key store for "${path}" not found!`);
            return false;
        }

        let targetArr = Object.entries(kinfo.keystore).find(arr => {
            return arr[1].address && (arr[1].address === address.replace(/^0x/, ''));
        });

        if (!targetArr) {
            logger.warn(`Delete key store for "${address}" not found!`);
            return false;
        }

        let index = targetArr[0];
        delete kinfo.keystore[index];
        kinfo.count--;

        ksTbl.update(chainID, kinfo);
        return true;
    },

    getUserAccountForChain(chainID) {
        if (typeof chainID !== 'number') {
            throw new error.InvalidParameter("Invalid parameter!")
        }
        let usrTbl = global.hdWalletDB.getUserTable();
        let ainfo = usrTbl.read(chainID);
        if (!ainfo) {
            //throw new error.NotFound(`Get user accounts for chainID '${chainID}' not found`);
            logger.info(`No user accounts for chainID '${chainID}'`)
            ainfo = {};
        }
        return ainfo;
    },

    deleteAll(password) {
        logger.warn("About to delete everything!!!");
        if (typeof password !== 'string') {
            logger.error("Missing password when deletion everything!");
            throw new error.InvalidParameter("Missing password!")
        }

        if (!this.hasMnemonic()) {
            logger.error("Delete everything do not has mnemonic!");
            throw new error.LogicError("Delete everything do not has mnemonic!")
        }

        // OTA db
        global.wanScanDB.delete(password, this.revealMnemonic);
        // HD wallet db
        global.hdWalletDB.delete(password, this.revealMnemonic);

        logger.warn("Delete everything completed!!!");
    },

    getChainTypeByChainID(chainID) {
        if (typeof chainID !== 'number') {
            throw new error.InvalidParameter("Invalid parameter!")
        }
        let walletTbl = global.hdWalletDB.getWalletTable();
        let ainfo = walletTbl.read(chainID);
        if (!ainfo || !ainfo.hasOwnProperty("chain")) {
            throw new error.NotFound(`Chain for "${chainID}" not found`);
        }
        return ainfo.chain;
    },

    getImportAccountsForChain(network, chainID) {
        if (typeof network !== 'string' || typeof chainID !== 'number') {
            throw new error.InvalidParameter("Invalid parameter!")
        }
        let netTbl;
        if (network === 'testnet') {
            netTbl = global.hdWalletDB.getTestTable();
        } else {
            netTbl = global.hdWalletDB.getMainTable();
        }
        let ainfo = netTbl.read(chainID);
        if (!ainfo) {
            logger.info(`No import accounts for chainID '${chainID}' '${network}'`)
            ainfo = {};
        }
        return ainfo;
    },

    getImportAccountNamesForChain(network, chainID) {
        if (typeof network !== 'string' || typeof chainID !== 'number') {
            throw new error.InvalidParameter("Invalid parameter!")
        }
        let netTbl;
        if (network === 'testnet') {
            netTbl = global.hdWalletDB.getTestTable();
        } else {
            netTbl = global.hdWalletDB.getMainTable();
        }
        let ainfo = netTbl.read(chainID);
        let accounts = {};
        if (!ainfo) {
            logger.info(`No import accounts for chainID '${chainID}' '${network}'`)
            ainfo = {};
        } else {
            accounts = ainfo.accounts;
        }
        return Object.keys(accounts);
    },

    getImportAccountsByPubKeyForChain(network, chainID, pubKey, wids = [1], permission = 'active') {
        try {
            if (typeof network !== 'string' || typeof chainID !== 'number' || typeof pubKey !== 'string') {
                throw new error.InvalidParameter("Invalid parameter!")
            }
            let netTbl;
            if (network === 'testnet') {
                netTbl = global.hdWalletDB.getTestTable();
            } else {
                netTbl = global.hdWalletDB.getMainTable();
            }
            let ainfo = netTbl.read(chainID);
            let accounts = [];
            if (!ainfo || !ainfo.hasOwnProperty("accounts")) {
                logger.info(`No import accounts for chainID '${network}' '${chainID}' '${pubKey}' !`)
            } else {
                for (var account in ainfo.accounts) {
                    if (wids instanceof Array) {
                        wids.forEach(wid => {
                            if(ainfo.accounts[account][permission].keys.hasOwnProperty(wid)) {
                                let obj = ainfo.accounts[account][permission].keys[wid];
                                for (var path in obj) {
                                    if (obj[path].key === pubKey) {
                                        accounts.push(account);
                                    }
                                }
                            }
                        });
                    } else {
                        throw new error.InvalidParameter("Invalid parameter!")
                    }
                }
            }
            return accounts;
        } catch (err) {
            logger.info(`No import accounts for chainID '${network}' '${chainID}' '${pubKey}' !`)
            return [];
        }
    },

    getImportAccountKeysForChain(network, chainID, account, permission = 'active', wid) {
        if (typeof network !== 'string' || typeof chainID !== 'number' || typeof account !== 'string' || typeof permission !== 'string') {
            throw new error.InvalidParameter("Invalid parameter!")
        }
        let netTbl;
        if (network === 'testnet') {
            netTbl = global.hdWalletDB.getTestTable();
        } else {
            netTbl = global.hdWalletDB.getMainTable();
        }
        let ainfo = netTbl.read(chainID);
        if (!ainfo || !ainfo.hasOwnProperty("accounts") || !ainfo.accounts.hasOwnProperty(account) ||
            !ainfo.accounts[account].hasOwnProperty(permission) || !ainfo.accounts[account][permission].hasOwnProperty('keys')) {
            logger.info(`No import accounts for chainID '${network}' '${chainID}' '${account}' '${permission}' !`)
            ainfo = {};
        } else {
            if (typeof wid === 'undefined') {
                ainfo = {
                    [wid]: ainfo.accounts[account][permission].keys[wid]
                }
            } else {
                ainfo = ainfo.accounts[account][permission].keys;
            }
        }
        return ainfo;
    },

    importUserAccount(network, wid, path, account, pubKey, permission = 'active') {
        if (typeof network !== 'string' || typeof wid !== 'number' || typeof path !== 'string' || typeof account !== 'string' || typeof pubKey !== 'string') {
            throw new error.InvalidParameter("Invalid parameter!")
        }
        let chainID = wanUtil.getChainIDFromBIP44Path(path);
        let chainType = this.getChainTypeByChainID(chainID);
        let perm = permission;
        let netTbl;
        if (network === 'testnet') {
            netTbl = global.hdWalletDB.getTestTable();
        } else {
            netTbl = global.hdWalletDB.getMainTable();
        }
        let ainfo = netTbl.read(chainID);
        if (!ainfo) {
            ainfo = {
                "chainID": chainID,
                "accounts": {
                    [account]: {
                        [perm]: {
                            "keys": {
                                [wid]: {
                                    [path]: {
                                        "key": pubKey
                                    }
                                }
                            }
                        }
                    }
                }
            }
            netTbl.insert(ainfo);
        } else {
            if (!ainfo.hasOwnProperty("accounts")) {
                ainfo.accounts = {};
            }
            if (!ainfo.accounts.hasOwnProperty(account)) {
                ainfo.accounts[account] = {};
            }
            if (!ainfo.accounts[account].hasOwnProperty(perm)) {
                ainfo.accounts[account][perm] = {};
            }
            if (!ainfo.accounts[account][perm].hasOwnProperty('keys')) {
                ainfo.accounts[account][perm].keys = {};
            }
            if (!ainfo.accounts[account][perm].keys.hasOwnProperty(wid)) {
                ainfo.accounts[account][perm].keys[wid] = {};
            }
            if (!ainfo.accounts[account][perm].keys[wid].hasOwnProperty(path)) {
                ainfo.accounts[account][perm].keys[wid][path] = {};
            }

            ainfo.accounts[account][perm].keys[wid][path] = {
                "key": pubKey
            }

            netTbl.update(chainID, ainfo);
        }
        return true;
    },

    deleteEOSImportedUserAccounts(accounts, network, chainID) {
        try {
            if (typeof accounts !== 'object' || typeof network !== 'string') {
                throw new error.InvalidParameter("Invalid parameter!")
            }
            let netTbl;
            if (network === 'testnet') {
                netTbl = global.hdWalletDB.getTestTable();
            } else {
                netTbl = global.hdWalletDB.getMainTable();
            }
            let ainfo = netTbl.read(chainID);
            if (!ainfo) {
                return false;
            } else {
                if (!ainfo.hasOwnProperty("accounts")) {
                    return false;
                }
                if (ainfo.accounts instanceof Object) {
                    accounts.forEach(account => {
                        delete ainfo.accounts[account];
                    });
                }
                netTbl.update(chainID, ainfo);
                return true;
            }
        } catch (e) {
            return false;
        }
    }
}
module.exports = hdUtil;
