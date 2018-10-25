'use strict'
// BTC
let CrossChainBtcLock     = require('./btc/CrossChainBtcLock');
let CrossChainBtcRedeem   = require('./btc/CrossChainBtcRedeem');
let CrossChainBtcRevoke   = require('./btc/CrossChainBtcRevoke');


// Eth
let CrossChainEthLock     = require('./eth/CrossChainEthLock');
let CrossChainEthRedeem   = require('./eth/CrossChainEthRedeem');
let CrossChainEthRevoke   = require('./eth/CrossChainEthRevoke');


// ERC20
let CrossChainE20Approve  = require('./erc20/CrossChainE20Approve');
let CrossChainE20Lock     = require('./erc20/CrossChainE20Lock');
let CrossChainE20Revoke   = require('./erc20/CrossChainE20Revoke');
let CrossChainE20Redeem   = require('./erc20/CrossChainE20Redeem');

module.exports={
  CrossChainBtcLock,
  CrossChainBtcRedeem,
  CrossChainBtcRevoke,
  CrossChainEthLock,
  CrossChainEthRedeem,
  CrossChainEthRevoke,
  CrossChainE20Approve,
  CrossChainE20Lock,
  CrossChainE20Revoke,
  CrossChainE20Redeem
};
