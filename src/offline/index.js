'use strict'

// offline
const signTx = require('./offline/signTx');

// online, ONLY for test on testnet
const sendTx = require('./online/sendTx');

module.exports = {
  signTx,
  sendTx
};
