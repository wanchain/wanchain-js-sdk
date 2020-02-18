/**
 * WAN naming service interface
 *
 * Copyright (c)2019, all rights reserved.
 */

var web3util = require('../util/web3util');
let error = require('../api/error');
let utils = require('../util/util');

const WANContract = require('./wancontract');

let logger = utils.getLogger('testRegistrar.js');

var web3 = web3util.getWeb3Instance();

class TestRegistrar extends WANContract {
    /**
     */
    constructor(wns) {
        let abi = utils.getConfigSetting('sdk:config:contract:wns:testRegistrar:abi', undefined);
        let addr = utils.getConfigSetting('sdk:config:contract:wns:testRegistrar:address', undefined);
        if (typeof abi !== 'object' || typeof addr !== 'string') {
            logger.error("Sorry, we don't have test registrar definition!");
            throw new error.LogicError("No test registrar definition!");
        }

        super(abi, addr);
        this.wns = wns;
    }

    /**
     * Test registrar
     */
    // Expiry time
    async expiryTimes(name) {
        if (!name) {
            logger.error("expiryTimes: missing required parameter [name]");
            throw new error.InvalidParameter("Missing required parameter [name]");
        }
        let myname = web3.utils.sha3(name);
        return await this.call('expiryTimes', myname);
    }

    //
    async register(name, owner, txinfo) {
        if (!name) {
            logger.error("register: missing required parameter [name]");
            throw new error.InvalidParameter("Missing required parameter [name]");
        }
        if (!owner) {
            logger.error("register: missing required parameter [owner]");
            throw new error.InvalidParameter("Missing required parameter [owner]");
        }
        if (typeof txinfo !== 'object') {
            logger.error("register: invalid parameter [txinfo]");
            throw new error.InvalidParameter("Invalid parameter [txinfo]");
        }

        let myname = web3.utils.sha3(name);

        // send is async function!
        let txhash = await this.send('register', txinfo, myname, owner);

        return txhash;

    }
};

module.exports = TestRegistrar;
