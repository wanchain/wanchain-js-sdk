/**
 * Base for asset 
 *
 * Copyright (c) wanchain, all rights reserved
 */
'use strict';

const Chain = require('../chain');
const ccUtil = require('../../api/ccUtil');

const ethUtil = require('ethereumjs-util')


const ETH_NAME = "ETH";
const ETH_BIP44_ID = 60;

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
     * @param {hdwallet} HDWallet - HD wallet that manages keys
     * @param {walletStore} HDWalletDB - DB that store wallet info
     */
    constructor(hdwallet, walletStore) {
        super(ETH_NAME, ETH_BIP44_ID, hdwallet, walletStore);
    }


    async getTxCount(address) {
        /* WARNING: address should start with 0x for ccUtil call */
        return ccUtil.getNonceByLocal('0x'+address.toString('hex'), this.name);
    }

    toAddress(publicKey) {
        return ethUtil.publicToAddress(publicKey, true);
    }
}

module.exports = ETH

/* eof */
