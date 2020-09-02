/**
 * Eos chain
 *
 * Copyright (c) wanchain, all rights reserved
 */
'use strict';

const Chain = require('./chain');
const wanUtil = require('../../util/util');
const error = require('../../api/error');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
// const Eos = require('eosjs');
// const Fcbuffer = require('fcbuffer')
const ecc = require('eosjs-ecc')
const wif = require('wif');

const EOS_NAME = "EOS";
const EOS_BIP44_ID = 194;

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
        return ecc.PublicKey(publicKey).toString();
    }

    toPrivateAddress(privateKey) {
        return ecc.PrivateKey(privateKey).toString();
    }

    privKeyToPublicKey(privateKey) {
        return ecc.PrivateKey.fromString(privateKey).toPublic().toString();
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

        logger.debug("TX param", JSON.stringify(wanUtil.hiddenProperties(tx.contractData,['x']), null, 4));

        const chain_id = global.eosChainId;

        // const eos = Eos();
        // const chain_id = global.eosChainId;
        // const transaction = tx.contractData;
        // let abi, htclAccount;
        // if (tx.config.srcChainType === 'EOS') {
        //     abi =tx.config.midSCAbi;
        //     htclAccount = tx.config.midSCAddr;
        // } else {
        //     abi = tx.config.dstAbi;
        //     htclAccount = tx.config.dstSCAddr;
        // }
        // eos.fc.abiCache.abi(htclAccount, abi);

        // const Transaction = eos.fc.structs.transaction;
        // console.log("Transaction is", transaction);
        // const buf = Fcbuffer.toBuffer(Transaction, transaction);
        // console.log("buf is", buf);
        // const chain_id_buf = new Buffer(chain_id, 'hex')
        // console.log("chain_id_buf is", chain_id_buf);
        // const sign_buf = Buffer.concat([chain_id_buf, buf, new Buffer(new Uint8Array(32))])

        let sig;
        if (hdwallet.isSupportGetPrivateKey()) {
            logger.info("Sign transaction by private key");
            let rawPriv = await hdwallet.getPrivateKey(path, opt);
            let privKey = wif.encode(0x80, rawPriv, false);
            let pubKey = this.privKeyToPublicKey(privKey)
            logger.info("Sign transaction by key", pubKey);
            // sig = ecc.sign(sign_buf, privKey);

            const signatureProvider = new JsSignatureProvider([privKey]);
            let serializedTransaction = new Uint8Array(Object.values(tx.contractData.serializedTransaction));
            sig = await signatureProvider.sign({
                chainId:chain_id,
                requiredKeys: [pubKey],
                serializedTransaction:serializedTransaction});
        }

        // return {
        //     compression: 'none',
        //     transaction: transaction,
        //     signatures: [sig]
        // };
        return sig;
    }
}

module.exports = EOS;

/* eof */
