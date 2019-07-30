/**
 * WNS util
 *
 * Copyright (c) 2019, all rights reserved.
 */
'use strict'

let web3util = require('../util/web3util');
let utils  = require('../util/util');
let ccUtil = require('../api/ccUtil');
let error  = require('../api/error');

let logger = utils.getLogger('wnsutil.js');

module.exports.namehash = function(name) {
    var web3 = web3util.getWeb3Instance();
    var node = '0x0000000000000000000000000000000000000000000000000000000000000000';
    if (name != '') {
        var labels = name.split(".");
        for(var i = labels.length - 1; i >= 0; i--) {
            node = web3.utils.sha3(node + web3.utils.sha3(labels[i]).slice(2), {encoding: 'hex'});
        }
    }
    return node.toString();

}

module.exports.sendTransaction = function(data) {
    let retryTimes = utils.getConfigSetting('network:retries', 3);
    let myerr;

    for (let i=0; i<retryTimes; i++) {
        try {
            // This is WNS send transaction.
            let res = ccUtil.sendTrans(data, 'WAN');
            return res;
        } catch (err) {
            myerr = err;
            logger.error("Caught error when sendTransaction, try %d times, error=%s", i+1, err);
        }
    }

    throw myerr;
}
