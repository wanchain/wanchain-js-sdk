'use strict'

// common
let setFilePath             = require('./utils/tool').setFilePath;
let getOutputPath           = require('./utils/tool').getOutputPath;

// offline
let buildTx                 = require('./offline/buildTx');

// online, ONLY for test on testnet
let sendTx                  = require('./online/sendTx');

module.exports = {
  setFilePath,
  getOutputPath,
  buildTx,
  sendTx
};
