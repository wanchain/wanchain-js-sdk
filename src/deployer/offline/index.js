'use strict'

// offline
const buildTx = require('./offline/buildTx');

// online, ONLY for test on testnet
const sendTx = require('./online/sendTx');

module.exports = {
  buildTx,
  sendTx
};
