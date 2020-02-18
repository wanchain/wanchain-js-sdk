'use strict'
// BTC
let NormalChainBtc     = require('./btc/NormalChainBtc');
// Eth
let NormalChainEth     = require('./eth/NormalChainEth');
// ERC20
let NormalChainE20  = require('./erc20/NormalChainE20');
// EOS
let NormalChainEos  = require('./eos/NormalChainEos');
module.exports={
  NormalChainBtc,
  NormalChainEth,
  NormalChainE20,
  NormalChainEos
};
