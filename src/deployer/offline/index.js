'use strict'

// common
let setFilePath             = require('./utils/tool').setFilePath;
let getOutputPath           = require('./utils/tool').getOutputPath;
let getNonceOffline         = require('./utils/tool').getNonce;
let updateNonce             = require('./utils/tool').updateNonce;
let initNonce               = require('./utils/scTool').initNonce;

// offline
let buildTx                 = require('./offline/buildTx');

// online
let sendTx                  = require('./online/sendTx');

module.exports = {
  setFilePath,
  getOutputPath,
  getNonceOffline,
  // send tx
  initNonce,                // called by online
  updateNonce,              // called by offline
  buildTx,
  sendTx
};
