/**
 * BNB chain
 *
 * Copyright (c) wanchain, all rights reserved
 */
'use strict';

const Chain = require('./chain');
const ccUtil = require('../../api/ccUtil');
const wanUtil= require('../../util/util');
const error  = require('../../api/error');

const ethUtil = require('ethereumjs-util')
const ethTx   = require('ethereumjs-tx');
const { EthRawTx } = require('./ethtx');

const CHAIN_NAME = "BNB";
const CHAIN_BIP44_ID = 60;

const logger = wanUtil.getLogger('bsc.js');

/**
 * BNB chain
 *
 */
class BNB extends Chain {
    /**
     * Constructor
     *
     * @param {name} string - name of asset
     * @param {id} number   - identity number of asset defined in BIP44
     * @param {walletSafe} Safe - Safe to keep wallets 
     * @param {walletStore} table - Wallet table that store wallet info
     */
    constructor(walletSafe, walletStore) {
        super(CHAIN_NAME, CHAIN_BIP44_ID, walletSafe, walletStore);
    }


    async getTxCount(address) {
        /* WARNING: address should start with 0x for ccUtil call */
        return ccUtil.getNonceByLocal('0x'+address.toString('hex'), this.name);
    }

    async getAddressByPrivateKey(wid, chain, privateKey) {
        if (wid == null || wid == undefined || chain == null || chain == undefined || privateKey == null || privateKey == undefined) {
            throw new error.InvalidParameter("Missing required parameter");
        }
        let addr = ethUtil.privateToAddress(privateKey);
        return addr.toString('hex');
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
    async signTransaction(wid, tx, path, opt) {
        if (wid == null || wid == undefined || !tx || !path) {
            throw new error.InvalidParameter("Invalid parameter");
        }

        let hdwallet = this.walletSafe.getWallet(wid);

        // Check if path is valid 
        let splitPath = this._splitPath(path);

        logger.debug("TX param", JSON.stringify(wanUtil.hiddenProperties(tx,['x']), null, 4));

        let bsctx = new ethTx(tx);
        if (hdwallet.isSupportGetPrivateKey()) {
            logger.info("Sign transaction by private key");
            let privKey = await hdwallet.getPrivateKey(path, opt);
            bsctx.sign(privKey);
        } else if (hdwallet.isSupportSignTransaction()) {
            logger.info("Sign transaction by wallet");
            // ONLY ledger supports this
            let tx2 = new EthRawTx(tx);
            let rawTx = tx2.serialize();
            let sig = await hdwallet.sec256k1sign(path, rawTx.toString('hex')); 

            // refer https://github.com/ethereumjs/ethereumjs-tx/blob/master/index.js 
            let chainId = bsctx.getChainId();
            Object.assign(bsctx, sig);
        }
        //logger.info("Verify signatiure: ", bsctx.verifySignature());
        return bsctx.serialize();
    }
}

module.exports = BNB;

/* eof */