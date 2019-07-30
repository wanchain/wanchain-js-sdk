/**
 * WAN naming service interface
 *
 * Copyright (c)2019, all rights reserved.
 */

var web3util = require('../util/web3util');
let error = require('../api/error');
let utils = require('../util/util');

const WANContract = require('./wancontract');

let logger = utils.getLogger('deedRegistrar.js');

var web3 = web3util.getWeb3Instance();

class DeedRegistrar extends WANContract {
    /**
     */
    constructor(addr) {
        let abi = utils.getConfigSetting('sdk:config:contract:wns:deedRegistrar:abi', undefined);
        if (typeof abi !== 'object') {
            logger.error("Sorry, we don't have deed registrar definition!");
            throw new error.LogicError("No deed registrar definition!");
        }

        super(abi, addr);
    }

    at(addr) {
        logger.info("Set resolver address to:", addr);
        this.addr = addr;
        return this;
    }

    // get auction winner.
    async owner() {
        return await this.call('owner');
    }

    //
};

module.exports = DeedRegistrar;
