/**
 * Base for asset 
 *
 * Liscened under MIT.
 * Copyright (c) 2019 wanchain, all rights reserved!
 */
'use strict';

const util = require('util');
const ethUtil = require('ethereumjs-util');
const wanUtil = require('wanchain-util');
const wanTx   = wanUtil.wanchainTx;
const { WanRawTx } = require('./ethtx');

const ccUtil = require('../../api/ccUtil');
const sdkUtil= require('../../util/util');
const Chain  = require('./chain');
const WID    = require('../wallets/walletids');

const WAN_NAME = "WAN";
const WAN_BIP44_ID = 5718350; // https://github.com/satoshilabs/slips/blob/master/slip-0044.md
//const WAN_BIP44_ID = 60;

const logger = sdkUtil.getLogger("wan.js");

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
     * @param {walletSafe} Safe - Safe to keep wallets 
     * @param {walletStore} HDWalletDB - DB that store wallet info
     */
    constructor(walletSafe, walletStore) {
        super(WAN_NAME, WAN_BIP44_ID, walletSafe, walletStore);
    }

    /**
     */
    async getAddress(wid, startPath, end, account, internal) {
        if (wid == null || wid == undefined || startPath == null || startPath == undefined) {
            throw new Error("Missing required parameter");
        }

        if (typeof startPath === 'string') {
            return this._getAddressByPath(wid, startPath);
        } else {
            return this._scanAddress(wid, startPath, end, account, internal);
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
     * @param {wid} number - wallet ID
     * @param {tx} object - structured transaction to be signed
     * @param {path} string - path in HD wallet used to sign
     * @return {Buffer} signed buffer
     */
    async signTransaction(wid, tx, path) {
        if (wid == null || wid == undefined || !tx || !path) {
            throw new Error("Invalid parameter");
        }

        let hdwallet = this.walletSafe.getWallet(wid);

        // Check if path is valid 
        let splitPath = this._splitPath(path);

        // get private key
        logger.debug("Transaction param: ", JSON.stringify(tx, null, 4));
        let wantx = new wanTx(tx);
        if (hdwallet.isSupportGetPrivateKey()) {
            logger.info("Sign transaction by private key");

            let privKey = await hdwallet.getPrivateKey(path);
            wantx.sign(privKey);

            return wantx.serialize();
        } else if (hdwallet.isSupportSignTransaction()) {
            logger.info("Sign transaction by wallet");

            // WAN only support mainnet
            if ((wid == WID.WALLET_ID_LEDGER) && (!sdkUtil.isOnMainNet())) {

                let errmsg = util.format("Wallet %s only support mainnet for chain %s!", WID.toString(wid), this.name);
                logger.error(errmsg);
                throw new Error(errmsg);
            }

            let tx2 = new WanRawTx(tx);
            let rawTx = tx2.serialize();
            let sig = await hdwallet.sec256k1sign(path, rawTx); 

            // refer https://github.com/ethereumjs/ethereumjs-tx/blob/master/index.js 
            let chainId = wantx.getChainId();
            Object.assign(wantx, sig);

            logger.debug("Verify signatiure: ", wantx.verifySignature());

            return wantx.serialize();
        }
    }
    /**
     */
    async _getAddressByPath(wid, path) {
        if (wid == null || wid == undefined || !path) {
            throw new Error("Missing required parameter");
        }

        let splitPath = this._splitPath(path);

        let change = splitPath.change;

        if (change != 0) {
            throw new Error(`Invalid path ${path}, chain must be external`);
        }

        let extAddr = await super._getAddressByPath(wid, path);

        let intPath = util.format("%s/%s/%s/%s/%d/%d", splitPath.key, 
                         splitPath.purpose, splitPath.coinType, splitPath.account, 1, splitPath.index); 
        let intAddr = await super._getAddressByPath(wid, intPath);

        let pubKey1 = Buffer.from(extAddr.pubKey, 'hex');
        let pubKey2 = Buffer.from(intAddr.pubKey, 'hex');
        let waddr = wanUtil.convertPubKeytoWaddr(pubKey1, pubKey2);

        extAddr["waddress"] = waddr.slice(2);

        return extAddr;
    }

    async _scanAddress(wid, start, end, account, internal) {
        if (wid == null || wid == undefined || 
            start == null || start == undefined || 
            end == null || end == undefined) {
            throw new Error("Missing required parameter");
        }

        if (end < start) {
            throw new Error(`Invalid parameter start=${start} must be less equal to end=${end}.`);
        }

        let extAddr = await super._scanAddress(wid, start, end, account, internal);
        //extAddr["addresses"].forEach(e=>{
        for (let i=0; i<extAddr["addresses"].length; i++) {
            let e = extAddr["addresses"][i];
            let splitPath = this._splitPath(e.path);

            //let change = splitPath[splitPath.length-2];
            let intPath = util.format("%s/%s/%s/%s/%d/%d", splitPath.key, 
                         splitPath.purpose, splitPath.coinType, splitPath.account, 1, splitPath.index); 
            let intAddr = await super._getAddressByPath(wid, intPath);

            let pubKey1 = Buffer.from(e.pubKey, 'hex');
            let pubKey2 = Buffer.from(intAddr.pubKey, 'hex');
            let waddr = wanUtil.convertPubKeytoWaddr(pubKey1, pubKey2);
            e["waddress"] = waddr.slice(2);
        }
        return extAddr;
    }
}

module.exports = WAN;

/* eof */
