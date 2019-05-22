/**
 * Eos chain
 *
 * Copyright (c) wanchain, all rights reserved
 */
'use strict';

const Chain = require('./chain');
// const ccUtil = require('../../api/ccUtil');
const wanUtil = require('../../util/util');
const error = require('../../api/error');
const Eos = require('eosjs');
const Fcbuffer = require('fcbuffer')
const ecc = require('eosjs-ecc')
const wif = require('wif');

const EOS_NAME = "EOS";
const EOS_BIP44_ID = 60;

const logger = wanUtil.getLogger('eos.js');

/**
 * EOS chain
 *
 */
class EOS extends Chain {
    /**
     * Constructor
     *
     * @param {name} string - name of asset
     * @param {id} number   - identity number of asset defined in BIP44
     * @param {walletSafe} Safe - Safe to keep wallets 
     * @param {walletStore} table - Wallet table that store wallet info
     */
    constructor(walletSafe, walletStore) {
        super(EOS_NAME, EOS_BIP44_ID, walletSafe, walletStore);
    }


    async getTxCount(address) {
        /* WARNING: address should start with 0x for ccUtil call */
        return null;
    }

    toAddress(publicKey) {
        return null;
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

        // // Check if path is valid 
        // let splitPath = this._splitPath(path);

        logger.debug("TX param", JSON.stringify(tx, null, 4));

        const eos = Eos();
        const chain_id = tx.chain_id;
        const transaction = tx.transaction;

        const Transaction = eos.fc.structs.transaction;
        console.log("Transaction is", transaction);
        const buf = Fcbuffer.toBuffer(Transaction, transaction);
        console.log("buf is", buf);
        const chain_id_buf = new Buffer(chain_id, 'hex')
        console.log("chain_id_buf is", chain_id_buf);
        const sign_buf = Buffer.concat([chain_id_buf, buf, new Buffer(new Uint8Array(32))])

        let sig;
        if (hdwallet.isSupportGetPrivateKey()) {
            logger.info("Sign transaction by private key");
            let rawPriv = await hdwallet.getPrivateKey(path, opt);
            let privKey = wif.encode(0x80, rawPriv, false);
            sig = ecc.sign(sign_buf, privKey);
        }
        //logger.info("Verify signatiure: ", ethtx.verifySignature());
        return {
            compression: 'none',
            transaction: transaction,
            signatures: [sig]
        };
    }
}

module.exports = EOS;

/* eof */
