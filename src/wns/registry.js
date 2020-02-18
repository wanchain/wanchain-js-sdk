/**
 * WAN naming service interface
 *
 * Copyright (c)2019, all rights reserved.
 */

let utils = require('../util/util');
let error = require('../api/error');
let wnsutils = require('./util');

const WANContract = require('./wancontract');

let logger = utils.getLogger('registry.js');

class Registry extends WANContract {
    constructor() {
        let abi = utils.getConfigSetting('sdk:config:contract:wns:registry:abi', undefined);
        let addr = utils.getConfigSetting('sdk:config:contract:wns:registry:address', undefined);
        if (typeof abi !== 'object' || typeof addr !== 'string') {
            logger.error("Sorry, we don't have registry definition!");
            throw new error.LogicError("No registry definition!");
        }

        super(abi, addr);
    }

    /**
     * WNS functions
     */
    owner(name) {
        if (!name) {
            logger.error("owner: missing required parameter [name]");
            throw new error.InvalidParameter("Missing required parameter [name]");
        }
        let myname = web3.utils.sha3(name);
        return this.call('owner', myname);
    }

    async resolver(name) {
        if (!name) {
            logger.error("resolver: missing required parameter [name]");
            throw new error.InvalidParameter("Missing required parameter [name]");
        }
        // TODO: use namehash
        let myname = wnsutils.namehash(name);
        return await this.call('resolver', myname);
    }

    ttl(name) {
        if (!name) {
            logger.error("ttl: missing required parameter [name]");
            throw new error.InvalidParameter("Missing required parameter [name]");
        }
        let myname = web3.utils.sha3(name);
        return this.call('ttl', myname);
    }

    async setOwner(name, owner, txinfo) {
        if (!name) {
            logger.error("setOwner: missing required parameter [name]");
            throw new error.InvalidParameter("Missing required parameter [name]");
        }

        if (!owner) {
            logger.error("setOwner: missing required parameter [owner]");
            throw new error.InvalidParameter("Missing required parameter [owner]");
        }

        if (typeof txinfo !== 'object') {
            logger.error("setOwner: invalid parameter [txinfo]");
            throw new error.InvalidParameter("Invalid parameter [txinfo]");
        }

        let myname = wnsutils.namehash(name);
        // send is async function!
        let txhash = await this.send('setOwner', txinfo, myname, owner);

        return txhash;
    }

    async setResolver(name, resolver, txinfo) {
        if (!name) {
            logger.error("setResolver: missing required parameter [name]");
            throw new error.InvalidParameter("Missing required parameter [name]");
        }

        if (!resolver) {
            logger.error("setResolver: missing required parameter [owner]");
            throw new error.InvalidParameter("Missing required parameter [owner]");
        }

        if (typeof txinfo !== 'object') {
            logger.error("setResolver: invalid parameter [txinfo]");
            throw new error.InvalidParameter("Invalid parameter [txinfo]");
        }

        let myname = wnsutils.namehash(name);
        let txhash = await this.send('setResolver', txinfo, myname, resolver);

        return txhash;
    }

    async setSubnodeOwner(name, label, owner, txinfo) {
        if (!name) {
            logger.error("setSubnodeOwner: missing required parameter [name]");
            throw new error.InvalidParameter("Missing required parameter [name]");
        }

        if (!label) {
            logger.error("setSubnodeOwner: missing required parameter [label]");
            throw new error.InvalidParameter("Missing required parameter [label]");
        }

        if (!owner) {
            logger.error("setSubnodeOwner: missing required parameter [owner]");
            throw new error.InvalidParameter("Missing required parameter [owner]");
        }

        if (typeof txinfo !== 'object') {
            logger.error("setSubnodeOwner: invalid parameter [txinfo]");
            throw new error.InvalidParameter("Invalid parameter [txinfo]");
        }

        let myname = wnsutils.namehash(name);
        let mylabel = web3.utils.sha3(name);
        // send is async function!
        let txhash = await this.send('setSubnodeOwner', txinfo, myname, mylabel, owner);

        return txhash;
    }

    async setTTL(name, ttl, txinfo) {
        if (!name) {
            logger.error("setTTL: missing required parameter [name]");
            throw new error.InvalidParameter("Missing required parameter [name]");
        }

        if (typeof ttl !== 'number') {
            logger.error("setTTL: missing required parameter [ttl]");
            throw new error.InvalidParameter("Missing required parameter [ttl]");
        }

        if (typeof txinfo !== 'object') {
            logger.error("setTTL: invalid parameter [txinfo]");
            throw new error.InvalidParameter("Invalid parameter [txinfo]");
        }

        let myname = web3.utils.sha3(name);
        // send is async function!
        let txhash = await this.send('setTTL', txinfo, myname, ttl);
    }
};

module.exports = Registry;
