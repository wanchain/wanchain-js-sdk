/**
 * Base for asset 
 *
 * Copyright (c) wanchain, all rights reserved
 */
'use strict';

const util = require('util');
const ethUtil = require('ethereumjs-util');
const wanUtil = require('wanchain-util');
const wanTx   = wanUtil.wanchainTx;

const ccUtil = require('../../api/ccUtil');
const Chain  = require('../chain');

const WAN_NAME = "WAN";
const WAN_BIP44_ID = 5718350; // https://github.com/satoshilabs/slips/blob/master/slip-0044.md
//const WAN_BIP44_ID = 60;

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

    /**
     */
    async getAddress(startPath, end, account, internal) {
        if (typeof startPath === 'string') {
            return this._getAddressByPath(startPath);
        } else {
            return this._scanAddress(startPath, end, account, internal);
        }
    }

    /**
     */
    async getTxCount(address) {
        /* WARNING: address should start with 0x for ccUtil call */
        return ccUtil.getNonceByLocal('0x'+address.toString('hex'), this.name);
    }

    toAddress(publicKey) {
        return ethUtil.publicToAddress(publicKey, true);
    }

    /**
     * Sign transaction
     *
     * @param {tx}   - structured transaction to be signed
     * @param {path} - path in HD wallet used to sign
     * @return {Buffer} signed buffer
     */
    signTransaction(tx, path) {
        if (!tx || !path) {
            throw new Error("Invalid parameter");
        }

        // Check if path is valid 
        let splitPath = this._splitPath(path);

        // get private key
        let privKey =  this.hdwallet.getPrivateKey(path);

        let wantx = new wanTx(tx);
        wantx.sign(privKey);
        return wantx.serialize();
    }
    /**
     */
    async _getAddressByPath(path) {
        let splitPath = this._splitPath(path);

        let change = splitPath.change;

        if (change != 0) {
            throw new Error(`Invalid path ${path}, chain must be external`);
        }

        let extAddr = await super._getAddressByPath(path);

        let intPath = util.format("%s/%s/%s/%s/%d/%d", splitPath.key, 
                         splitPath.purpose, splitPath.coinType, splitPath.account, 1, splitPath.index); 
        let intAddr = await super._getAddressByPath(intPath);

        let pubKey1 = Buffer.from(extAddr.pubKey, 'hex');
        let pubKey2 = Buffer.from(intAddr.pubKey, 'hex');
        let waddr = wanUtil.convertPubKeytoWaddr(pubKey1, pubKey2);

        extAddr["waddress"] = waddr.slice(2);

        return extAddr;
    }

    async _scanAddress(start, end, account, internal) {
        let extAddr = await super._scanAddress(start, end, account, internal);
        //extAddr["addresses"].forEach(e=>{
        for (let i=0; i<extAddr["addresses"].length; i++) {
            let e = extAddr["addresses"][i];
            let splitPath = this._splitPath(e.path);

            //let change = splitPath[splitPath.length-2];
            let intPath = util.format("%s/%s/%s/%s/%d/%d", splitPath.key, 
                         splitPath.purpose, splitPath.coinType, splitPath.account, 1, splitPath.index); 
            let intAddr = await super._getAddressByPath(intPath);

            let pubKey1 = Buffer.from(e.pubKey, 'hex');
            let pubKey2 = Buffer.from(intAddr.pubKey, 'hex');
            let waddr = wanUtil.convertPubKeytoWaddr(pubKey1, pubKey2);
            e["waddress"] = waddr.slice(2);
        }
        return extAddr;
    }
}

module.exports = WAN

/* eof */
