/**
 * Chain Manager
 *
 * Copyright (c) Wanchain, all rights reserved.
 */
'use strict';

const Safe = require('./safe');
const wanUtil = require('../util/util');

const error = require('../api/error');

let {
    ETH,
    WAN,
    BTC
} = require('./chains');

let logger = wanUtil.getLogger("chainmanager.js");

class ChainManager {
    /**
     * Constructor
     */
    constructor(walletStore) {
        this.walletSafe  = null;
        this.walletStore = walletStore;
        this.chains = {};
    }

    /**
     * New one chain manager
     *
     * @param {walletStore} HDWalletDB - DB to store HD wallet info.
     * @returns {ChainManager}
     */
    static NewManager(walletStore) {
        if (!walletStore) {
            throw new error.InvalidParameter("Invalid parameter");
        }

        let mgr = new ChainManager(walletStore);
        mgr._initWalletSafe();
        mgr._initChains(wanUtil.getConfigSetting("wallets:chainMap", {}));

        return mgr;
    }

    shutdown() {
        logger.info("Shuting down...")
        if (this.walletSafe) {
            this.walletSafe.close();
            this.walletSafe = null;
        }
    }

    /**
     * Get chain by name
     *
     * @param {name} string - name of chain to retrieve
     * @returns {Object} - chain object or null if not registered
     */
    getChain(name) {
        if (this.chains.hasOwnProperty(name)) {
            return this.chains[name];
        }

        return null;
    }

    /**
     * Get all registered chains' name
     *
     * @returns {Array} - array of names of registered chain
     */
    getRegisteredChains() {
        let registered = [];
        for (let key in this.chains) {
            if (this.chains.hasOwnProperty(key)) {
                registered.push(key);
            }
        }

        return registered;
    }

    getWalletSafe() {
        return this.walletSafe;
    }

    newNativeWallet(mnemonic) {
        if (!mnemonic) {
            throw new error.InvalidParameter("Missing mnemonic to create native wallet");
        }

        this.walletSafe.newNativeWallet(mnemonic);
    }

    /**
     * Initialize chain map
     */
    _initChains(chainMap) {
        if (!chainMap || typeof chainMap !== 'object') {
            throw new error.InvalidParameter("Invalid parameter");
        }

        logger.info("Initialize with chain map: ", JSON.stringify(chainMap, null, 4));
        for (let key in chainMap) {
            if (chainMap.hasOwnProperty(key)) {
                let cinfo = chainMap[key];
                let chain = eval(`new ${cinfo.class}(this.walletSafe, this.walletStore)`);

                logger.info(`Initialize chain ${key}`);

                this.chains[key] = chain;
            }
        }
    }

    /**
     * Initialize safe to store different wallet, it generates a native HD wallet
     *
     * @param {mnemonic} string - mnemonic to generate native HD wallet
     */
    _initWalletSafe() {
        this.walletSafe = new Safe();
    }

    /**
     * Register new chain
     *
     * @param {name} string - name of the chain
     * @param {chain} Ojbect - the chain object
     */
    _registerChain(name, chain) {
        this.chains[name] = chain;
    }

}

module.exports = ChainManager;
