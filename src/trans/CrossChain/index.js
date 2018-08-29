'use strict'
// BTC
let CrossChainBtcLock     = require('./btc/CrossChainBtcLock');
let CrossChainBtcRefund   = require('./btc/CrossChainBtcRefund');
let CrossChainBtcRevoke   = require('./btc/CrossChainBtcRevoke');


// Eth
let CrossChainEthLock     = require('./eth/CrossChainEthLock');
let CrossChainEthRefund     = require('./eth/CrossChainEthRefund');
let CrossChainEthRevoke     = require('./eth/CrossChainEthRevoke');


// ERC20
let CrossChainE20Approve  = require('./erc20/CrossChainE20Approve');
let CrossChainE20Lock     = require('./erc20/CrossChainE20Lock');
let CrossChainE20Revoke   = require('./erc20/CrossChainE20Revoke');
let CrossChainE20Refund   = require('./erc20/CrossChainE20Refund');

module.exports={
  CrossChainBtcLock,
  CrossChainBtcRefund,
  CrossChainBtcRevoke,
  CrossChainEthLock,
  CrossChainEthRefund,
  CrossChainEthRevoke,
  CrossChainE20Approve,
  CrossChainE20Lock,
  CrossChainE20Revoke,
  CrossChainE20Refund
};