/**
 * WAN naming service interface
 *
 * Copyright (c)2019, all rights reserved.
 */
'use strict'

let utils = require('../util/util');
let error = require('../api/error');
let wnsutils = require('./util');

const WANContract = require('./wancontract');

let logger = utils.getLogger('publicResolver.js');

class PublicResolver extends WANContract {
    constructor() {
        let abi = utils.getConfigSetting('sdk:config:contract:wns:publicResolver:abi', undefined);
        let addr = utils.getConfigSetting('sdk:config:contract:wns:publicResolver:address', undefined);

        if (typeof abi !== 'object' || typeof addr !== 'string') {
            logger.error("Sorry, we don't have registry definition!");
            throw new error.LogicError("No registry definition!");
        }

        super(abi, addr);
    }

    /**
     * Resolution
     */

    at(addr) {
        logger.info("Set resolver address to:", addr);
        this.addr = addr;
        return this;
    }

    async supportsInterface(feature) {
        return await this.call('supportsInterface', feature);
    }

    // Resolver - public

    // Get addr of the name
    async address(name) {
        if (!name) {
            logger.error("addr: missing required parameter [name]");
            throw new error.InvalidParameter("Missing required parameter [name]");
        }
        let myname = wnsutils.namehash(name);
        return await this.call('addr', myname);
    }

    // Associate addr with name
    async setAddr(name, owner, txinfo) {
        if (!name) {
            logger.error("setAddr: missing required parameter [name]");
            throw new error.InvalidParameter("Missing required parameter [name]");
        }

        if (!owner) {
            logger.error("setAddr: missing required parameter [owner]");
            throw new error.InvalidParameter("Missing required parameter [owner]");
        }

        let myname = wnsutils.namehash(name);
        let txhash = await this.send('setAddr', txinfo, myname, owner);
        return txhash;
    }

    // Set name's resolver

    // Associate addr with name

    // Transfer name
};

module.exports = PublicResolver;
