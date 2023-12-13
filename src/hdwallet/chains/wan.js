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
const { EthRawTx } = require('./ethtx');
const Common = require('@ethereumjs/common').default;
const { TransactionFactory } = require('@ethereumjs/tx');
const ccUtil = require('../../api/ccUtil');
const sdkUtil= require('../../util/util');
const Chain  = require('./chain');
const WID    = require('../wallets/walletids');
const error  = require('../../api/error');

const WAN_NAME = "WAN";
const WAN_BIP44_ID = 5718350; // https://github.com/satoshilabs/slips/blob/master/slip-0044.md

const _WID_SUPPORT_PRIVATE_ADDR=[WID.WALLET_ID_NATIVE, WID.WALLET_ID_KEYSTORE, WID.WALLET_ID_RAWKEY];

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
     * @param {walletStore} table - Wallet table that store wallet info
     */
    constructor(walletSafe, walletStore) {
        super(WAN_NAME, WAN_BIP44_ID, walletSafe, walletStore);
    }

    /**
     */
    async getAddress(wid, startPath, endOpt, account, internal, opt) {
        if (wid == null || wid == undefined || startPath == null || startPath == undefined) {
            throw new error.InvalidParameter("Missing required parameter");
        }

        if (_WID_SUPPORT_PRIVATE_ADDR.includes(wid)) {
            logger.info(`Wallet ID '${wid}' supports private address`);
            if (typeof startPath === 'string') {
                return this._getAddressByPath(wid, startPath, endOpt);
            } else {
                return this._scanAddress(wid, startPath, endOpt, account, internal, opt);
            }
        } else {
            if (typeof startPath === 'string') {
                return super._getAddressByPath(wid, startPath, endOpt);
            } else {
                return super._scanAddress(wid, startPath, endOpt, account, internal, opt);
            }
        }
    }

    /**
     */
    async getPrivateKeys(wid, path, opt) {
        if (typeof wid !== 'number' || typeof path !== 'string') {
            throw new error.InvalidParameter("Missing required parameter");
        }

        let splitPath = this._splitPath(path, false);

        let change = splitPath.change;

        if (change != 0) {
            throw new error.InvalidParameter(`Invalid path "${path}", chain must be external`);
        }

        let account = splitPath.account.slice(0,-1)
        let extPriv = await super.getPrivateKey(wid, splitPath.index, account, 0, opt);

        let keys = [ extPriv ]
        if (_WID_SUPPORT_PRIVATE_ADDR.includes(wid)) {
            logger.info(`Wallet ID '${wid}' supports private address`);
            let intPriv = await super.getPrivateKey(wid, splitPath.index, account, 1, opt);
            keys.push(intPriv)
        }

        return keys
    }

    /**
     */
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
     * @param {wid} number - wallet ID
     * @param {tx} object - structured transaction to be signed
     * @param {path} string - path in HD wallet used to sign
     * @param {opt} WaleltOpt - Wallet option to sign the tx
     * @return {Buffer} signed buffer
     */
    async signTransaction(wid, tx, path, opt) {
        if (wid == null || wid == undefined || !tx || !path) {
            throw new error.InvalidParameter("Invalid parameter");
        }

        let hdwallet = this.walletSafe.getWallet(wid);

        // Check if path is valid
        let splitPath = this._splitPath(path, false);

        logger.debug("TX param", JSON.stringify(sdkUtil.hiddenProperties(tx,['x']), null, 4));

        const common = Common.custom({ chainId: parseInt(tx.chainId) }); // chainId must be number
        const ethTx = TransactionFactory.fromTxData(tx, { common });
        console.log('tx: %O, ethTx: %O', tx, ethTx.toJSON())
        let signedTx;
        if (hdwallet.isSupportGetPrivateKey()) {
            logger.info("Sign transaction by private key");
            let privKey = await hdwallet.getPrivateKey(path, opt);
            signedTx = ethTx.sign(privKey);
        } else if (hdwallet.isSupportSignTransaction()) {
            logger.info("Sign transaction by wallet");
            // ONLY ledger supports this
            let isWanApp = (path.indexOf("44'/5718350'") >= 0);
            let tx2 = new EthRawTx(tx);
            let rawTx = tx2.serialize();
            let sig = await hdwallet.sec256k1sign(path, rawTx.toString('hex'));

            // refer https://github.com/ethereumjs/ethereumjs-tx/blob/master/index.js
            let chainId = ethtx.getChainId();
            Object.assign(ethtx, sig);
        }
        //logger.info("Verify signatiure: ", ethtx.verifySignature());
        let result = signedTx.serialize().toString('hex');
        console.log('sign result: %s', result);
        return result;
    }
    /**
     */
    async _getAddressByPath(wid, path, opt) {
        if (wid == null || wid == undefined || !path) {
            throw new error.InvalidParameter("Missing required parameter");
        }

        let splitPath = this._splitPath(path, false);

        let change = splitPath.change;

        if (change != 0) {
            throw new error.InvalidParameter(`Invalid path "${path}", chain must be external`);
        }

        let hdwallet = this.walletSafe.getWallet(wid);
        let addr;

        if (hdwallet.isSupportGetAddress()) {
            logger.info("Wallet ID '%d' supports get address directly.", wid);

            opt = opt || {}
            opt.includeWaddress = true

            addr =  await super._getAddressByPath(wid, path, opt);
        } else if (hdwallet.isSupportGetPublicKey()) {
            let extAddr = await super._getAddressByPath(wid, path, opt);
            let intPath = util.format("%s/%s/%s/%s/%d/%d", splitPath.key,
                             splitPath.purpose, splitPath.coinType, splitPath.account, 1, splitPath.index);
            let intAddr = await super._getAddressByPath(wid, intPath, opt);

            let pubKey1 = Buffer.from(extAddr.pubKey, 'hex');
            let pubKey2 = Buffer.from(intAddr.pubKey, 'hex');
            let waddr = wanUtil.convertPubKeytoWaddr(pubKey1, pubKey2);

            extAddr["waddress"] = waddr.slice(2);
            addr =  extAddr;
        } else {
            throw new error.NotSupport(`Wallet "${wid}" not able to get address for path "${path}"!`);
        }

        return addr;
    }

    async _scanAddress(wid, start, end, account, internal, opt) {
        if (wid == null || wid == undefined ||
            start == null || start == undefined ||
            end == null || end == undefined) {
            throw new error.InvalidParameter("Missing required parameter");
        }

        if (end < start) {
            throw new error.InvalidParameter(`Invalid parameter start="${start}" must be less equal to end="${end}".`);
        }

        let hdwallet = this.walletSafe.getWallet(wid);
        if (!hdwallet.isSupportGetPublicKey()) {
            logger.error("Wallet not support get public key!")
            throw new error.LogicError("Scan address not support get public key");
        }

        let extAddr = await super._scanAddress(wid, start, end, account, internal, opt);
        //extAddr["addresses"].forEach(e=>{
        for (let i=0; i<extAddr["addresses"].length; i++) {
            let e = extAddr["addresses"][i];
            let splitPath = this._splitPath(e.path, false);

            //let change = splitPath[splitPath.length-2];
            let intPath = util.format("%s/%s/%s/%s/%d/%d", splitPath.key,
                         splitPath.purpose, splitPath.coinType, splitPath.account, 1, splitPath.index);
            //let intAddr = await super._getAddressByPath(wid, intPath, opt);
            let intPubKey = await hdwallet.getPublicKey(intPath, opt);

            let extPubKey = e.pubKey;
            if (!e.pubKey) {
                extPubKey = await hdwallet.getPublicKey(e.path, opt)
            }

            let pubKey1 = Buffer.from(extPubKey, 'hex');
            let pubKey2 = Buffer.from(intPubKey, 'hex');
            let waddr = wanUtil.convertPubKeytoWaddr(pubKey1, pubKey2);
            e["waddress"] = waddr.slice(2);
        }
        return extAddr;
    }
}

module.exports = WAN;

/* eof */
