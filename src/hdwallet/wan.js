/**
 * Base for asset 
 *
 * Copyright (c) wanchain, all rights reserved
 */

'use strict';

const util = require('util');
const ethUtil = require('ethereumjs-util')
const wanUtil = require('wanchain-util')

const Chain = require('./chain');

const WAN_NAME = "WAN";
//const WAN_BIP44_ID = 5718350;
const WAN_BIP44_ID = 60;
/**
 * WAN chain
 *
 */
class WAN extends Chain {
    /**
     * Constructor
     *
     * @param {name} string - name of asset
     * @param {id} number   - identity number of asset defined in BIP44
     * @param {hdwallet} HDWallet - HD wallet that manages keys
     * @param {walletStore} HDWalletDB - DB that store wallet info
     */
    constructor(hdwallet, walletStore) {
        super(WAN_NAME, WAN_BIP44_ID, hdwallet, walletStore);
    }

    async getAddress(startPath, end, account, internal) {
        if (typeof start === 'string') {
            return this._getAddressByPath(startPath);
        } else {
            return this._scanAddress(startPath, end, account, internal);
        }
    }

    async getTxCount(address) {
        return Promise.resolve(1);
    }

    toAddress(publicKey) {
        return ethUtil.publicToAddress(publicKey, true);
    }

    /**
     */
    async _getAddressByPath(path) {
        // path format:  m/purpose'/coin_type'/account'/change/address_index
        //
        let splitPath = path.split('/');
        if (splitPath.length != 6) {
            throw new Error(`Invalid path ${path}`);
        }
        if (splitPath[0].toLowerCase() != 'm') {
            throw new Error(`Invalid path ${path}, must be started with m/M`);
        }

        let chainID = splitPath[2].slice(0, -1);

        //if (chainID != WAN_BIP44_ID) {
        //    throw new Error(`Invalid path ${path}, chain must be ${WAN_BIP44_ID}`);
        //}

        let index = splitPath[splitPath.length-1];
        let change = splitPath[splitPath.length-2];

        let extAddr = super._getAddressByPath(path);
        let intPath = util.format("%s/%s/%s/%s/%d/%d", splitPath[0], splitPath[1], splitPath[2], splitPath[3], 1, index); 
        let intAddr = super._getAddressByPath(intPath);

        let pubKey1 = Buffer.from(extAddr.pubKey, 'hex');
        let pubKey2 = Buffer.from(intAddr.pubKey, 'hex');
        let waddr = wanUtil.convertPubKeytoWaddr(pubKey1, pubKey2);
    }

}

module.exports = WAN

/* eof */
