/**
 * Chain Manager
 *
 * Copyright (c) Wanchain, all rights reserved.
 */
'use strict';

const Safe = require('./safe');
const config = require('../conf/config');

let {
    ETH,
    WAN
} = require('./chains');

class ChainManager {
    /**/
    constructor(walletStore) {
        this.walletSafe  = null;
        this.walletStore = walletStore;
        this.chains = {};
    }

    /**
     * New one chain manager
     *
     * @param {mnemonic} string - Mnemonic used to generate master seed for HD wallet
     * @param {walletStore} HDWalletDB - DB to store HD wallet info.
     * @returns {ChainManager}
     */
    static NewManager(mnemonic, walletStore) {
        if (!mnemonic || !walletStore) {
            throw new Error("Invalid parameter");
        }

        let mgr = new ChainManager(walletStore);
        mgr._initWalletSafe(mnemonic);
        mgr._initChains(config.chainMap);

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


    _initChains(chainMap) {
        if (!chainMap || typeof chainMap !== 'object') {
            throw new Error("Invalid parameter");
        }

        for (let key in chainMap) {
            if (chainMap.hasOwnProperty(key)) {
                let cinfo = chainMap[key];
                let chain = eval(`new ${cinfo.class}(this.walletSafe, this.walletStore)`);

                this.chains[key] = chain;
            }
        }
    }

    _initWalletSafe(mnemonic) {
        this.walletSafe = new Safe();
        this.walletSafe.newNativeWallet(mnemonic);
    }

    _registerChain(name, chain) {
        this.chains[name] = chain;
    }

}

module.exports = ChainManager;
