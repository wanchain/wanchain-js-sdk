/**
 * iWan RPC client
 *
 * Liscensed under MIT license.
 * Copyright (c) 2019, Wanchain.
 */

const iWanClient = require('iwan-sdk');
const error = require('../../api/error');
const utils = require('../../util/util');

let logger = utils.getLogger('iWanRpc.js');

class iWanRPC {
    constructor(key, secret, opt) {
        opt = opt || {}
        this._client = new iWanClient(key, secret, opt);
    }

    /**
     */
    close() {
        this._client.close();
    }

    /**
     * Call method 'fn' with timeout ms
     */
    call(fn, timeout, ...args) {
        let f = Reflect.get(this._client, fn);
        if (typeof f != 'function') {
            throw new error.InvalidParameter(`Invalid function ${fn}`);
        }

        let p = Reflect.apply(f, this._client, ...args);

        return utils.promiseTimeout(timeout, p);
    }
}

module.exports = iWanRPC;
