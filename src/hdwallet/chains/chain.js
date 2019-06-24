/**
 * Chain definition
 *
 * Copyright (c) wanchain, all rights reserved
 */
'use strict';

const util    = require('util');
const wanUtil = require('../../util/util');
const error   = require('../../api/error');

const BIP44_PURPOSE=44;
const BIP44_ADDR_GAP_LIMIT=20;
const BIP44_PATH_LEN=6;

const logger = wanUtil.getLogger("chain.js");

/**
 * Asset definition
 *
 */
class Chain {
    /**
     * Constructor
     *
     * @param {name} string - name of chain
     * @param {id} number   - identity number of chain defined in BIP44
     * @param {walletSafe} Safe - Wallet safe
     * @param {walletStore} table - Wallet table to store hd account info
     */
    constructor(name, id, walletSafe, walletStore) {
        this.name = name;
        this.id   = id;
        this.walletSafe = walletSafe;
        this.walletStore= walletStore;

        this._loadChainInfo();
    }

    name() {
        return this.name;
    }

    /**
     * Get addresses
     *
     * Get address in [start, end), if returned address is less than expected,
     * that means BIP44 gap limit reached, we may not create address for user.
     *
     * @param {wid} number - wallet ID to get address
     * @param {startPath} number or string - start index when number, path when string
     * @param {end} number - end index (not include), only when startPath is number
     * @param {account} number - account in BIP44, default 0, only when startPath is number
     * @param {internal} bool -  external or internal, default external(false), only when startPath is number
     * @param {opt} object - option:
     *     {
     *         "password" : string,
     *         "chkfunc" : function,
     *         "forcechk" : bool,
     *
     *         "includeWaddress" : bool
     *     }
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
     */
    async getAddress(wid, startPath, endOpt, account, internal, opt) {
        if (wid == null || wid == undefined) {
            throw new error.InvalidParameter("Missing wallet ID");
        }

        if (typeof startPath === 'string') {
            return this._getAddressByPath(wid, startPath, endOpt);
        } else {
            return this._scanAddress(wid, startPath, endOpt, account, internal, opt);
        }
    }

    /**
     * Discovery address as specified in BIP44
     *
     * @param {wid} number - wallet ID to get address
     * @param {startAccount} number -
     * @param {startIndex} number -
     * @param {total} number - number of addresses expected to return
     * @param {internal} bool - discover internal address
     * @param {skipTxCheck} bool - check transaction on discovered address or not
     * @return {object} -
     *   {
     *       "metadata" : {
     *           "totalDiscovered" : number,
     *           "lastScaned" : {
     *               "account" : number,
     *               "index" : number
     *           },
     *           "lastUsedAddress" : {
     *               account : index
     *           }
     *       },
     *       "addressInfo" : [
     *           addressInfo
     *       ]
     *   }
     *
     *   addressInfo: {
     *       "account" : number,
     *       "index" : number,
     *       "path" : string,
     *       "pubKey" : string,
     *       "address" : string
     *   }
     */
    async discoverAddress(wid, startAccount, startIndex, total, internal, skipTxCheck, opt) {
        if (wid == null || wid == undefined ||
            startAccount == null || startAccount == undefined ||
            startIndex == null || startIndex == undefined ||
            total == null || total == undefined) {
            throw new error.InvalidParameter("Invalid parameter");
        }

        let hdwallet = this.walletSafe.getWallet(wid);

        let getAddrFunc;
        if (hdwallet.isSupportGetAddress()) {
            getAddrFunc = async function(path) {
                let addr = await hdwallet.getAddress(path, opt);
                return addr.address;
            }
        } else if (hdwallet.isSupportGetPublicKey()) {
            let self = this;
            getAddrFunc = async function(path) {
                let pubKey = await hdwallet.getPublicKey(path, opt);
                return self.toAddress(pubKey);
            }

        } else {
            throw new error.NotSupport(`Wallet "${wid}" not able to discover address!`);
        }

        let root = util.format("m/%d'/%d'", BIP44_PURPOSE, this.id);

        let gap = 0;
        let account = startAccount;
        let ret = {
            "metadata" : {
                "totalDiscovered" : 0,
                "lastScaned" : {
                    "account" : startAccount,
                    "index" : startIndex
                },
                "lastUsedAddress" : {
                }

            },
            "addressInfo" : []
        };

        internal = internal || false;
        skipTxCheck = skipTxCheck || false;

        let change = 0;
        if (internal) {
            change = 1;
        }

        let totalCount = 0;
        let accountTx = 0;
        let lastAccount = startAccount;
        let lastIndex   = startIndex;

        let lastUsedMap = ret["metadata"]["lastUsedAddress"];

        for (let i = startIndex; i < startIndex + total; i++) {
            let path = util.format("%s/%d'/%d/%d", root, account, change, i);
            try {
                //let pubKey = await hdwallet.getPublicKey(path, opt);
                //let address = this.toAddress(pubKey);
                let address = await getAddrFunc(path);
                let txCount = skipTxCheck ? 0 : await this.getTxCount(address);

                if (!lastUsedMap.hasOwnProperty(account)) {
                    lastUsedMap[account] = -1;
                }

                if (txCount != 0 || skipTxCheck) {
                    gap = 0;
                    accountTx += txCount
                    lastUsedMap[account] = i;
                } else {
                    gap++;
                }

                if (gap > BIP44_ADDR_GAP_LIMIT) {
                    if (accountTx > 0 || skipTxCheck) {
                        account++;
                        accountTx = 0;
                    } else {
                        // No tx found, stop scan
                        break;
                    }
                }

                let addr = {
                    "account" : account,
                    "index" : i,
                    "path" : path,
                    //"pubKey" : pubKey.toString('hex'),
                    "address" : address.toString('hex')
                };
                ret["addressInfo"].push(addr);
                lastAccount = account;
                lastIndex = i;
                totalCount++;
            } catch (err) {
                logger.error(`Caught error when discover address "${path}": "${err}"`);
                break;
            }
        }

        ret["metadata"]["totalDiscovered"] = totalCount;
        ret["metadata"]["lastScaned"]["account"] = lastAccount;
        ret["metadata"]["lastScaned"]["index"]   = lastIndex;

        return ret;
    }

    /**
     * Get private for address specified by index
     */
    async getPrivateKey(wid, index, account, internal, opt) {
        if (wid == null || wid == undefined || index == null || index == undefined) {
            throw new error.InvalidParameter("Missing required parameter");
        }

        account = account || 0;
        internal = internal || false;

        let hdwallet = this.walletSafe.getWallet(wid);

        if (!hdwallet.isSupportGetPrivateKey()) {
            throw new error.NotSupport(`Wallet '${wid}' is not support get private key`);
        }

        let change = 0;
        if (internal) {
            change = 1;
        }

        let path = util.format("m/%d'/%d'/%d'/%d/%d", BIP44_PURPOSE, this.id, account, change, index);
        return hdwallet.getPrivateKey(path, opt);
    }

    /**
     * Sign transaction
     */
    async signTransaction(wid, tx, path, opt) {
        if (wid == null || wid == undefined || !tx || !path) {
            throw new error.InvalidParameter("Invalid parameter");
        }

        let hdwallet = this.walletSafe.getWallet(wid);

        // Check if path is valid
        let splitPath = this._splitPath(path);

        // get private key
        if (hdwallet.isSupportGetPrivateKey()) {
            let privKey =  hdwallet.getPrivateKey(path, opt);
        } else if (hdwallet.isSupportSignTransaction()) {
            //let sign = hdwallet.sec256k1sign();
        }

        throw new error.NotImplemented("Not implementation");
    }

    /**
     */
    async getTxCount(address) {
        throw new error.NotImplemented("Fatal error, illogic");
    }

    /**
     */
    toAddress(publicKey) {
        throw new error.NotImplemented("Fatal error, illogic");
    }

    /**
     */
    _loadChainInfo() {
        let info = this.walletStore.read(this.id);
        if (!info) {
            info = {
                "chain" : this.name,
                "chainID" : this.id,
                "lastScaned" : {
                    account : 0,
                    index : -1
                },
                "lastUsed" : {
                    "0" : -1
                }
            }
            this.walletStore.insert(info);
        }
        //this.info = info;
    }

    /**
     */
    async _getAddressByPath(wid, path, opt) {
        if (wid == null || wid == undefined || !path) {
            throw new error.InvalidParameter("Missing required parameter");
        }

        let addr;

        let hdwallet = this.walletSafe.getWallet(wid);
        if (hdwallet.isSupportGetAddress()) {
            let address  = await hdwallet.getAddress(path, opt);

            let ret =  {
                "path" : path,
            }

            addr = Object.assign(ret, address);
        } else if (hdwallet.isSupportGetPublicKey()) {
            // get address from public key
            let pubKey  = await hdwallet.getPublicKey(path, opt);
            let address = this.toAddress(pubKey);

            addr = {
                "path" : path,
                "pubKey" :  pubKey.toString('hex'),
                "address" : address.toString('hex')
            };
        } else {
            throw new error.NotSupport(`Wallet "${wid}" not able to get address for path "${path}"!`);
        }

        return addr;
    }

    /**
     *
     */
    async _scanAddress(wid, start, end, account, internal, opt) {
        if (wid == null || wid == undefined ||
            start == null || start == undefined ||
            end == null || end == undefined) {
            throw new error.InvalidParameter("Missing required parameter");
        }

        if (end < start) {
            throw new error.InvalidParameter(`Invalid parameter start="${start}" must less equal to end="${end}"`);
        }

        account = account || 0;
        internal = internal || false;

        let info = this.walletStore.read(this.id);
        if (!info) {
            throw new error.NotFound("Chain not exist");
        }

        let lastUsedIdx = -1;
        if (info["lastUsed"].hasOwnProperty(account)) {
            lastUsedIdx = info["lastUsed"][account];
        }

        let reqStart = start;

        lastUsedIdx++;
        if (lastUsedIdx < start) {
            start = lastUsedIdx;
        }

        let total = end - start;

        let skipTxCheck = false;
        if (opt && opt.hasOwnProperty('skipTxCheck')) {
            skipTxCheck = opt.skipTxCheck;
        }

        let discoverAddr = await this.discoverAddress(wid, account, start, total, internal, skipTxCheck, opt);

        let filterAddr = discoverAddr["addressInfo"].filter(address => address.account == account && address.index >= reqStart);

        if (discoverAddr["metadata"]["lastUsedAddress"][account] >= lastUsedIdx) {
            Object.assign(info["lastUsed"], discoverAddr["metadata"]["lastUsedAddress"]);
        }
        Object.assign(info["lastScaned"], discoverAddr["metadata"]["lastScaned"]);

        this.walletStore.update(this.id, info);

        let retAddr = {
            "addresses": filterAddr,
            "start" : start
        }

        return retAddr;
    }

    /**
     */
    _splitPath(path) {
        if (!path) {
            throw new error.InvalidParameter("Invalid parameter");
        }

        // path format:  m/purpose'/coin_type'/account'/change/address_index
        let splitPath = path.split('/');
        if (splitPath.length != BIP44_PATH_LEN) {
            throw new error.InvalidParameter(`Invalid path "${path}", expected length "${BIP44_PATH_LEN}", got "${splitPath.length}"`);
        }

        if (splitPath[0].toLowerCase() != 'm') {
            throw new error.InvalidParameter(`Invalid path "${path}", must be started with m/M`);
        }

        if (splitPath[1].slice(-1) != '\'') {
            throw new error.InvalidParameter(`Invalid path "${path}", purpose must be hardened derivation`);
        }

        let purpose = splitPath[1].slice(0, -1);
        if (purpose != BIP44_PURPOSE) {
            throw new error.InvalidParameter(`Invalid path "${path}", purpose not support`);
        }

        if (splitPath[2].slice(-1) != '\'') {
            throw new error.InvalidParameter(`Invalid path "${path}", coin type must be hardened derivation`);
        }

        let chainID = splitPath[2].slice(0, -1);
        if (chainID != this.id) {
            throw new error.InvalidParameter(`Invalid path "${path}", chain must be "${this.id}"!`);
        }

        if (splitPath[3].slice(-1) != '\'') {
            throw new error.InvalidParameter(`Invalid path "${path}", account must be hardened derivation`);
        }

        return {
            "key"     : splitPath[0],
            "purpose" : splitPath[1],
            "coinType": splitPath[2],
            "account" : splitPath[3],
            "change"  : splitPath[4],
            "index"   : splitPath[5]
        };
    }

}

module.exports = Chain;

/* eof */
