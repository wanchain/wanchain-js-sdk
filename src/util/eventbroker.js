/**
 * Event broker
 *
 * Copyright 2019, Wanchain. Liscened under MIT liscense
 */
'use strict'

let assert = require('assert')

module.exports.EVENT_DISCONNET = "disconnect";
module.exports.EVENT_PROBELOSS = "probeloss";
module.exports.CIRCUIT_BREAK = "circuitbreak";

// disconnect event
module.exports.newDisconnectEvent = function(device, id) {
    return {
        "Device" : device,
        "ID"     : id
    }
};

// probeloss event
module.exports.newProbeLossEvent = function(device, lossCount) {
    return {
        "Device"   : device,
        "LossCount": lossCount
    }
};

// circuit break
module.exports.newCircuitBreakEvent = function(device, endpoint) {
    return {
        "Device"  : device,
        "Endpoint": endpoint
    }
};
module.exports.emit = function(evt, ...args) {
    _getEventEmitter().emit(evt, ...args);

};

function _getEventEmitter() {
    assert(global.WalletCore !== undefined)
    return global.WalletCore;
};


