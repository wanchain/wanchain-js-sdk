/**
 * Ripple
 *
 * Copyright (c) 2019 wanchain, licensed under MIT license.
 */
'use strict';

const Chain = require('./chain');
const ccUtil= require('../../api/ccUtil');
const utils = require('../../util/util');
const error = require('../../api/error');
const ripple = require('ripple-keypairs')

const XRP_NAME = "XRP";
const XRP_BIP44_ID = 144;

const logger = utils.getLogger('xrp.js');

/**
 * XRP chain
 *
 */
class XRP extends Chain {
    /**
     * Constructor
     *
     * @param {name} string - name of asset
     * @param {id} number   - identity number of asset defined in BIP44
     * @param {walletSafe} Safe - Safe to keep wallets 
     * @param {walletStore} table - Wallet table that store wallet info
     */
    constructor(walletSafe, walletStore) {
        super(XRP_NAME, XRP_BIP44_ID, walletSafe, walletStore);        
    }


    async getTxCount(address) {
        /* WARNING: address should start with 0x for ccUtil call */
        //return ccUtil.getNonceByLocal('0x'+address.toString('hex'), this.name);
        return 1;
    }

    toAddress(publicKey) {
      return ripple.deriveAddress(publicKey.toString('hex')).toString();
    }

    async getECPair(wid, path, opt) {
        if (wid == null || wid == undefined || !path) {
            throw new error.InvalidParameter("Invalid parameter");
        }

        let config = utils.getConfigSetting('sdk:config', undefined);
        let hdwallet = this.walletSafe.getWallet(wid);

        if (!hdwallet.isSupportGetPrivateKey()) {
            throw new error.NotSupport(`Wallet ID ${wid} is not support to get private key`);
        }

        let priv = await hdwallet.getPrivateKey(path, opt);

        // TODO: should use 'compressed' option?? default is true as previous wallet
        return ripple.ECPair.fromPrivateKey(priv, {network: config.bitcoinNetwork});
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
    async signTransaction(wid, tx, path, opt) {
        if (wid == null || wid == undefined || !tx || !path) {
            throw new error.InvalidParameter("Invalid parameter");
        }

        let hdwallet = this.walletSafe.getWallet(wid);

        throw new error.NotImplemented("Not implemented");
    }
}

module.exports = XRP;

/* eof */
