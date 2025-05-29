/**
 * VeChain
 *
 * Copyright (c) wanchain, all rights reserved
 */
'use strict';

const Chain = require('./chain');
const utils = require('../../util/util');
const error = require('../../api/error');
const ethUtil = require('ethereumjs-util');

const CHAIN_NAME = "VET";
const CHAIN_BIP44_ID = 818;

const logger = utils.getLogger('vet.js');

/**
 * VET chain
 *
 */
class VET extends Chain {
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
        //return ccUtil.getNonceByLocal('0x'+address.toString('hex'), this.name);
        return 1;
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
     * @param {opt} WalletOpt - wallet options to get sign transaction
     * @return {Buffer} signed buffer
     */
    async signTransaction(wid, packedTx, path, opt) {
        throw new error.NotSupport("Not neccessary for Offline SDK");
    }
}

module.exports = VET;

/* eof */
