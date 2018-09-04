'use strict'

let ccUtil = require('../api/ccUtil');
var Logger = require('../logger/logger');
// initial in wallet core.
// var sendByWebSocket = null;
// var sendByWeb3      = null;
function getLogger(name){
  return new Logger(name, './log/out.log','./log/err.log','debug');
};
// global chains data
/*
"tokens": [{
    "token": "0xc5bc855056d99ef4bda0a4ae937065315e2ae11a",
    "instance": "0x46e4df4b9c3044f12543adaa8ad0609d553041f9",
    "ratio": "200000",
    "defaultMinDeposit": "100000000000000000000",
    "originalChainHtlc": "0x28edd768b88c7c5ced685d9cee3fc205aa2e225c",
    "wanchainHtlc": "0x5d1dd99ebaa6ee3289d9cd3369948e4ce96736c2",
    "withdrawDelayTime": "259200"
  }]
 */

// global.sendByWebSocket  = sendByWebSocket;
// global.sendByWeb3       = sendByWeb3;
global.getLogger        = getLogger;
// exports.sendByWebSocket = global.sendByWebSocket = sendByWebSocket;
// exports.sendByWeb3      = global.sendByWeb3 = sendByWeb3;
// exports.getLogger       = global.getLogger = getLogger;