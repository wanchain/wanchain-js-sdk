/**
 * Chain definition
 *
 * Copyright (c) wanchain, all rights reserved
 */

'use strict';

const util = require('util');

const BIP44_PURPOSE=44;
const BIP44_ADDR_GAP_LIMIT=20;
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
     * @param {hdwallet} HDWallet - HD wallet that manages keys
     * @param {walletStore} HDWalletDB - DB to store hd account info
     */
    constructor(name, id, hdwallet, walletStore) {
        this.name = name;
        this.id   = id;
        this.hdwallet   = hdwallet;
        this.walletStore= walletStore;

        this._loadChainInfo();
    }

    /**
     * Get addresses
     *
     * Get address in [start, end), if returned address is less than expected,
     * that means BIP44 gap limit reached, we may not create address for user.
     *
     * @param {startPath} number or string - start index when number, path when string
     * @param {end} number - end index (not include), only when startPath is number
     * @param {account} number - account in BIP44, default 0, only when startPath is number
     * @param {internal} bool -  external or internal, default external(false), only when startPath is number
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
    async getAddress(startPath, end, account, internal) {
        if (typeof start === 'string') {
            return this._getAddressByPath(startPath);
        } else {
            return this._scanAddress(startPath, end, account, internal);
        }
    }

    /**
     * Discovery address as specified in BIP44
     *
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
    async discoverAddress(startAccount, startIndex, total, internal, skipTxCheck) {
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
            let pubKey = this.hdwallet.getPublicKey(path);
            let address = this.toAddress(pubKey);
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
                "pubKey" : pubKey.toString('hex'),
                "address" : address.toString('hex') 
            };
            ret["addressInfo"].push(addr);
            lastAccount = account;
            lastIndex = i;
            totalCount++;
        }

        ret["metadata"]["totalDiscovered"] = totalCount;
        ret["metadata"]["lastScaned"]["account"] = lastAccount;
        ret["metadata"]["lastScaned"]["index"]   = lastIndex;

        return ret;
    }

    /**
     * Get private for address specified by index 
     */
    getPrivateKey(index, account, internal) {
        account = account || 0;
        internal = internal || false;

        let change = 0;
        if (internal) {
            change = 1;
        }

        let path = util.format("m/%d'/%d'/%d'/%d/%d", BIP44_PURPOSE, this.id, account, change, index);
        return this.hdwallet.getPrivateKey(path);
    }

    /**
     */
    async getTxCount(address) {
        throw new Error("Fatal error, illogic");
    }

    /**
     */
    toAddress(publicKey) {
        throw new Error("Fatal error, illogic");
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
    async _getAddressByPath(path) {
        let pubKey = this.hdwallet.getPublicKey(path);
        let address = this.toAddress(pubKey);

        return {
            "path" : path,
            "pubKey" :  pubKey.toString('hex'),
            "address" : address.toString('hex') 
        };
    }

    /**
     */
    async _scanAddress(start, end, account, internal) {
        account = account || 0;
        internal = internal || false;

        let info = this.walletStore.read(this.id);
        if (!info) {
            throw new Error("Chain not exist");
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

        let discoverAddr = await this.discoverAddress(account, start, total, internal);

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

}

module.exports = Chain

/* eof */
