/**
 * Ethereum chain
 *
 * Copyright (c) wanchain, all rights reserved
 */
'use strict';

const Chain = require('./chain');
const ccUtil = require('../../api/ccUtil');
const wanUtil= require('../../util/util');

const ethUtil = require('ethereumjs-util')
//const ethTx   = require('ethereumjs-tx');
const ethTx   = require('./ethtx');

const rlp = require('rlp');

const ETH_NAME = "ETH";
const ETH_BIP44_ID = 60;

const logger = wanUtil.getLogger('eth.js');

/**
 * ETH chain
 *
 */
class ETH extends Chain {
    /**
     * Constructor
     *
     * @param {name} string - name of asset
     * @param {id} number   - identity number of asset defined in BIP44
     * @param {walletSafe} Safe - Safe to keep wallets 
     * @param {walletStore} HDWalletDB - DB that store wallet info
     */
    constructor(walletSafe, walletStore) {
        super(ETH_NAME, ETH_BIP44_ID, walletSafe, walletStore);
    }


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
     * @param {wid} number - structured transaction to be signed
     * @param {tx} object  - structured transaction to be signed
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

        let ethtx = new ethTx(tx);
        if (hdwallet.isSupportGetPrivateKey()) {
            logger.info("Sign transaction by private key");
            let privKey =  hdwallet.getPrivateKey(path);
            ethtx.sign(privKey);
        } else if (hdwallet.isSupportSignTransaction()) {
            logger.info("Sign transaction by wallet");
            let rawTx = ethtx.serialize();
            let sign = await hdwallet.sec256k1sign(path, rawTx.toString('hex')); 

            logger.info("Sign result: ", JSON.stringify(sign, null, 4));
        }
        return ethtx.serialize();
    }
}

module.exports = ETH;

/* eof */
