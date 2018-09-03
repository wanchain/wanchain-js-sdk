'use strict'
var Logger = require('../logger/logger');
// initial in wallet core.
// var sendByWebSocket = null;
// var sendByWeb3      = null;
function getLogger(name){
  return new Logger(name, './log/out.log','./log/err.log','debug');
};
// global.sendByWebSocket  = sendByWebSocket;
// global.sendByWeb3       = sendByWeb3;
global.getLogger        = getLogger;
// exports.sendByWebSocket = global.sendByWebSocket = sendByWebSocket;
// exports.sendByWeb3      = global.sendByWeb3 = sendByWeb3;
// exports.getLogger       = global.getLogger = getLogger;