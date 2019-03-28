/**
 * Web3 utility
 *
 * Copyright (c) 2019, wanchain.
 * Liscensed under MIT.
 */
'use strict'

const Web3  = require("web3");
const net   = require('net');
const utils = require("./util");

const wanUtil = require("wanchain-util");

let web3 = null;

module.exports.encodeParam = function(type, param) {
    let w = _mustGetWeb3Instance();

    return w.eth.abi.encodeParameter(type, param);
};

module.exports.toWei = function(n, unit) {
    let w = _mustGetWeb3Instance();

    if (utils.isBigNumber(n)) {
        n = n.toString();
    }
    return w.utils.toWei(n, unit);
};

module.exports.getDataByFuncInterface = function(abi, addr, func, ...args) {
    let w = _mustGetWeb3Instance();
    let c = new w.eth.Contract(abi, addr);
    let f = c.methods[func];

    return f(...args).encodeABI();
};

module.exports.getFullName = function (json) {
    if (json.name.indexOf('(') !== -1) {
        return json.name;
    }

    var typeName = json.inputs.map(function(i){return i.type; }).join();
    return json.name + '(' + typeName + ')';
};

module.exports.decodeEventLog = function(json, log) {
    let data  = log.data  || '';
    let topics= log.topics|| [];

    let w = _mustGetWeb3Instance();

    let decoded = web3.eth.abi.decodeLog(json, data, topics);

    log.args = decoded;

    return logs;
};

module.exports.signFunction = function(json) {
    let name = exports.getFullName(json);

    return wanUtil.sha3(name).toString('hex');
}

function _mustGetWeb3Instance() {
    if (web3) {
        return web3;
    }

    let rpcIpcPath = utils.getConfigSetting('sdk:config:rpcIpcPath', process.env.HOME);
    web3 = new Web3(new Web3.providers.IpcProvider(rpcIpcPath, net));

    return web3;
};

/* eof */

