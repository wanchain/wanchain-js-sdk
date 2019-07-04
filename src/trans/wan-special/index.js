'use strict'
// BTC
let PrivateChainWanSend  = require('./PrivateChainWanSend');
let PrivateChainWanRefund= require('./PrivateChainWanRefund');
let POSDelegateIn = require('./PosDelegateIn');
let POSDelegateOut= require('./PosDelegateOut');
let POSStakeIn    = require('./PosStakeIn');
let POSStakeUpdate= require('./PosStakeUpdate');
let POSStakeAppend= require('./PosStakeAppend');

module.exports={
    PrivateChainWanSend,
    PrivateChainWanRefund,
    POSDelegateIn,
    POSDelegateOut,
    POSStakeIn,
    POSStakeUpdate,
    POSStakeAppend,
};
