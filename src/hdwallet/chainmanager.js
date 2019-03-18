/**
 * Chain Manager
 *
 * Copyright (c) Wanchain, all rights reserved.
 */
'use strict';

const Safe = require('./safe');
const wanUtil = require('../util/util');

let {
    ETH,
    WAN
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
     * @param {mnemonic} string - Mnemonic used to generate master seed for native HD wallet
     * @param {walletStore} HDWalletDB - DB to store HD wallet info.
     * @returns {ChainManager}
     */
    static NewManager(mnemonic, walletStore) {
        if (!mnemonic || !walletStore) {
            throw new Error("Invalid parameter");
        }

        let mgr = new ChainManager(walletStore);
        mgr._initWalletSafe(mnemonic);
        mgr._initChains(wanUtil.getConfigSetting("chainMap", {}));

        return mgr;
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

    /**
     * Initialize chain map
     */
    _initChains(chainMap) {
        if (!chainMap || typeof chainMap !== 'object') {
            throw new Error("Invalid parameter");
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
    _initWalletSafe(mnemonic) {
        this.walletSafe = new Safe();
        this.walletSafe.newNativeWallet(mnemonic);
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
