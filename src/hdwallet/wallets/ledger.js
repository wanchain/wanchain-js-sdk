/**
 * Ledger wallet
 *
 * Licensed under MIT.
 * Copyright (c) 2019, Wanchain.
 */
require("babel-polyfill");
const _TransportNodeHid = require("@ledgerhq/hw-transport-node-hid");
const TransportNodeHid  = _interopRequireDefault(_TransportNodeHid);

const _hwAppEth = require("@ledgerhq/hw-app-eth");
const AppWan    = _interopRequireDefault(_hwAppEth);

const WID     = require('./walletids');
const HDWallet= require('./hdwallet');
const wanUtil = require('../../util/util');

const logger = wanUtil.getLogger("ledger.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// refer https://github.com/LedgerHQ/ledgerjs/blob/master/packages/hw-app-eth/src/utils.js#L36
function splitPath(path) {
    let result = [];
    let components = path.split("/");
    components.forEach(element => {
        let number = parseInt(element, 10);
        if (isNaN(number)) {
          return; // FIXME shouldn't it throws instead?
        }
        if (element.length > 1 && element[element.length - 1] === "'") {
          number += 0x80000000;
        }
        result.push(number);
    });
    return result;
}

const _SUPPORT_CHAINS = [ 0x8057414e, 0x8000003c ]; // WAN/ETH only

/**
 * Ledger wallet implementation
 */
class LedgerWallet extends HDWallet {
    /**
     */
    constructor() {
        super(WID.WALLET_CAPABILITY_GET_PUBKEY|WID.WALLET_CAPABILITY_GET_ADDRESS|WID.WALLET_CAPABILITY_SIGN_TRANSACTION);
        this._transport = null;
        this._app = null;
    }

    /**
     * Identity number 
     */
    static id() {
        return WID.WALLET_ID_LEDGER;
    }

    static name () {
        return WID.toString(LedgerWallet.id());
    }

    /**
     */
    async open() {
        try {
            // TODO: open the first device
            let self = this;
            self._transport = await TransportNodeHid.default.open("");
            //self._transport.setDebugMode(true);
            self._app = new AppWan.default(this._transport);

            self._transport.on("disconnect", function (){
                // TODO: handle disconnect event
                logger.warn("ledger disconnected!");
                self._transport.close();
                self._app = null;
            });

            logger.info("%s opened.", LedgerWallet.name());
            return true;
        } catch(err) {
            logger.error("%s open failed: %s", LedgerWallet.name(), err);
            return false;
        }
    }

    /**
     */
    async close() {
        if (this._transport) {
            this._transport.close();
        }

        logger.info("%s closed.", LedgerWallet.name());
        return true;
    }

    /**
     * Health check
     *
     * @return (bool} true if ok, otherwise false
     */
    async healthCheck() {
        //let response = await this._transport
        //                          .send(
        //                              0xe0, //
        //                              0x06, // get version
        //                              0x0,
        //                              0x0,
        //                              Buffer.alloc(0));
        //logger.debug("health check response: ", response);
        //if (response.length != 4) {
        //    return false;
        //}
        let app = this._app;
        if (!app) {
            logger.error("Wallet is not opened!");
            return false;
        }

        let p = app.getAppConfiguration();
        let timeout = wanUtil.getConfigSetting("healthcheck.timeout", 5000);

        try {
            let resp = await wanUtil.promiseTimeout(timeout, p);
            logger.debug("Device returned response:", JSON.stringify(resp, null, 4));
        } catch (err) {
            logger.error("Caught error when getting public key: %s", err);
            return false
        }

         return true;
    }

    /**
     * Get public key 
     *
     * We only support 'WAN', reference https://github.com/LedgerHQ/ledgerjs/blob/master/packages/hw-app-eth/src/Eth.js
     *
     * @param {path} string - BIP44 path
     */
    async getPublicKey(path) {
        logger.info("%s get public key for '%s'.", LedgerWallet.name(), path);

        let boolDisplay = false; // Do not display address and confirm before returning
        let boolChaincode = false; // Do not return the chain code

        let strippedPath = path.slice(2);
        let paths = splitPath(strippedPath);

        if (!_SUPPORT_CHAINS.includes(paths[1])) {
            logger.error(`Chain ${paths[1]} not supported`);
            throw new Error(`Chain ${paths[1]} not supported`);
        }

        let app = this._app;
        if (!app) {
            logger.error("Wallet is not opened!");
            throw new Error("Wallet is not opened!");
        }

        let p = app.getAddress(strippedPath, boolDisplay, boolChaincode);
        let timeout = wanUtil.getConfigSetting("healthcheck.timeout", 5000);

        try {
            let resp = await wanUtil.promiseTimeout(timeout, p);
            logger.debug("Device returned response:", JSON.stringify(resp, null, 4));

            let pubKey = Buffer.from(resp.publicKey, 'hex');
            logger.info("%s get public key for path '%s' completed.", LedgerWallet.name(), path);
            return pubKey;
        } catch (err) {
            logger.error("Caught error when getting public key: %s", err);
            throw err
        }

        //logger.debug("Building request buffer...");
        //let buffer = new Buffer(1 + paths.length * 4);
        //buffer[0] = paths.length;
        //paths.forEach((element, index) => {
        //    buffer.writeUInt32BE(element, 1 + 4 * index);
        //});
        //logger.debug("Sending request...");
        //let response = await this._transport
        //                          .send(
        //                              0xe0, //
        //                              0x02, // ins
        //                              boolDisplay ? 0x01 : 0x00,
        //                              boolChaincode ? 0x01 : 0x00,
        //                              buffer
        //                          );

        //let publicKeyLength = response[0];
        //let addressLength = response[1 + publicKeyLength];
        //let pubKey = response.slice(1, 1+publicKeyLength);
        //let address= response.slice(1+publicKeyLength+1, 1+publicKeyLength+1+addressLength);
        //logger.debug("Ledger returned address: 0x", address.toString('ascii'));

        //logger.info("%s get public key for path '%s' completed.", LedgerWallet.name(), path);

        //return pubKey;
    }

    /**
     */
    getPrivateKey(path) {
        throw new Error("Not implemented");
    }

    /**
     * Sign raw message using SEC(Standard for Efficent Cryptography) 256k1 curve
     *
     * @param {path} string, BIP44 path to locate private to sign the message
     * @param {buf} Buffer, raw message to sign
     * @return {Object} - {r, s, v}
     */
    async sec256k1sign(path, buf) {
        logger.info("%s signing message using sec256k1 for path '%s'...", LedgerWallet.name(), path);

        let strippedPath = path.slice(2);
        let paths = splitPath(strippedPath);

        if (!_SUPPORT_CHAINS.includes(paths[1])) {
            logger.error(`Chain ${paths[1]} not supported`);
            throw new Error(`Chain ${paths[1]} not supported`);
        }

        let app = this._app;
        if (!app) {
            logger.error("Wallet is not opened!");
            throw new Error("Wallet is not opened!");
        }

        try {
            let resp = await app.signTransaction(path, buf);
            logger.debug("Device returned response: ", JSON.stringify(resp, null, 4));
            logger.info("%s sign message using sec256k1 for path '%s' is completed.", LedgerWallet.name(), path);
            return resp;
        } catch (err) {
            logger.error("Caught error when signing transaction: %s", err);
            throw err
        }

    }
}

module.exports = LedgerWallet;


/* eof */
