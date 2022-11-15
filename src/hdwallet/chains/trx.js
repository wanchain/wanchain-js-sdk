/**
 * Ripple
 *
 * Copyright (c) 2019 wanchain, licensed under MIT license.
 */
'use strict';

const Chain = require('./chain');
const utils = require('../../util/util');
const error = require('../../api/error');
const TronWeb = require('tronweb');
const ethUtil = require('ethereumjs-util');

const CHAIN_NAME = "TRX";
const CHAIN_BIP44_ID = 195;
const tronweb = new TronWeb({fullHost: "https://api.nileex.io"});

const logger = utils.getLogger('trx.js');

/**
 * XRP chain
 *
 */
class TRX extends Chain {
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
      if (typeof(privateKey) !== "string") {
        privateKey = privateKey.toString("hex");
      }
      let addr = tronweb.address.fromPrivateKey(privateKey);
      console.log("trx getAddressByPrivateKey: %s", addr);
      return addr;
    }

    toAddress(publicKey) {
      publicKey = ethUtil.importPublic(publicKey);
      let addressBytes = tronweb.utils.crypto.computeAddress(publicKey);
      let base58 = tronweb.utils.crypto.getBase58CheckAddress(addressBytes);
      return base58;
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
        if (wid == null || wid == undefined || !packedTx || !path) {
            throw new error.InvalidParameter("Invalid parameter");
        }

        let hdwallet = this.walletSafe.getWallet(wid);

        let sig;
        if (hdwallet.isSupportGetPrivateKey()) {
          logger.info("Sign transaction by private key");
          let privateKey = await hdwallet.getPrivateKey(path, opt);
          let publicKey = await hdwallet.getPublicKey(path, opt);
          const keypair = { privateKey: privateKey.toString('hex'), publicKey: publicKey.toString('hex') };
          logger.info("Sign transaction by keypair", keypair);
        }
        return sig;
    }
}

module.exports = TRX;

/* eof */
