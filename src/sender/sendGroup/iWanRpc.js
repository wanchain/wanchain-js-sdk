/**
 * iWan RPC client
 *
 * Liscensed under MIT license.
 * Copyright (c) 2019, Wanchain.
 */

const iWanClient = require('iwan-sdk');
const error = require('../../api/error');
const utils = require('../../util/util');
const eb = require('../../util/eventbroker');

let logger = utils.getLogger('iWanRpc.js');

class iWanRPC {
    constructor(key, secret, opt) {
        opt = opt || {}
        this._client = new iWanClient(key, secret, opt);
        this._network = {
            "timedout" : 0,
            "slowRequest" : 0,
            "breakTime" : 0,
            "allowRequest" : true
        }
    }

    /**
     */
    close() {
        this._client.close();
    }

    getClientInstance() {
        return this._client;
    }

    /**
     * Call method 'fn' with timeout ms
     */
    async call(fn, timeout, ...args) {
        let f = Reflect.get(this._client, fn);
        if (typeof f != 'function') {
            throw new error.InvalidParameter(`Invalid function '${fn}'`);
        }

        if (!this._isNetworkOK()) {
            throw new error.Timeout(`Network not reachable, function '${fn}'`);
        }

        let p = Reflect.apply(f, this._client, ...args);
        let msg = `Call iWAN timed out, function '${fn}'!`

        try {
            let t1 = Date.now();
            let ret = await utils.promiseTimeout(timeout, p, msg);
            let t2 = Date.now();

            this._updateNetworkStat(t2-t1);
            return ret
        } catch(err) {
            this._handleNetworkError(err);
            throw err
        }
    }

    _updateNetworkStat(t) {
        //
        let timeLimit = utils.getConfigSetting("network:circuitBreaker:timeLimit", 10000);
        let timeThrottle = utils.getConfigSetting("network:circuitBreaker:timeThrottle", -1);
        if (t>=timeLimit) {
            this._network.slowRequest++
        } else {
            this._network.slowRequest = 0;
        }
        this._network.timedout = 0;

        if (timeThrottle != -1 && this._network.slowRequest > timeThrottle) {
            logger.warn("iWAN RPC network too slow, break for a while...")
            this._breakNetwork();
        }
    }

    _handleNetworkError(err) {
        let timeoutThrottle = utils.getConfigSetting("network:circuitBreaker:timeoutThrottle", 3);
        if (err instanceof error.Timeout) {
            this._network.timedout++;
            if (this._network.timedout > timeoutThrottle) {
                logger.warn("iWAN RPC seems down, break for a while...")
                this._breakNetwork();
            }

        }
    }

    _isNetworkOK() {
        if (this._network.allowRequest) {
            return true
        }

        let now = Date.now();
        let freeze = utils.getConfigSetting("network:circuitBreaker:freezeTime", 60000);
        if (now - this._network.breakTime > freeze) {
            this._network.allowRequest = true;
            return true;
        }
        return false;
    }

    _breakNetwork() {
        this._network.allowRequest = false;
        this._network.breakTime = Date.now();
        this._network.timedout = 0;
        this._network.slowRequest = 0;

        eb.emit(eb.CIRCUIT_BREAK, eb.newCircuitBreakEvent("network", "iWAN"));
    }
}

module.exports = iWanRPC;
