/**
 */

let param  = require('./input.json');
let hdUtil = require("../../../src/api/hdUtil");
let ccUtil = require("../../../src/api/ccUtil");

/**
 * Initialize HD wallet
 */
module.exports.initHDWallet = async function(password, strength, opt) {
    password = password || param.hd.password;
    strength = strength || param.hd.mnemonic.strength;
    opt = opt || {};

    let mnemonic;
    let hasMnemonic = hdUtil.hasMnemonic();
    if (hasMnemonic) {
        mnemonic = hdUtil.revealMnemonic(password);
        console.log("Revealed:", mnemonic);
        console.log("Is validate? ", hdUtil.validateMnemonic(mnemonic));
    }else if (opt.generateMnemonic){
        mnemonic = hdUtil.generateMnemonic(password, strength);
        console.log("Generated mnemonic:", mnemonic);
    }

    if (opt.importMnemonic) { 
        hdUtil.initializeHDWallet(opt.mnemonic);
    } else {
        hdUtil.initializeHDWallet(mnemonic);
    }

    if (opt.enableLedger) {
        console.log("Connecting to ledger");
        await hdUtil.connectToLedger();
    }

    if (opt.enableRawkey) {
        console.log("Creating raw key");
        await hdUtil.newRawKeyWallet();
    }

    if (opt.enableKeystore) {
        console.log("Creating key store");
        await hdUtil.newKeyStoreWallet();
    }

};

module.exports.getBtcTxForRedeem = function() {
    //{status: 'waitingX', chain: 'BTC'}
    return module.exports.getBtcTxHistory({status: 'waitingX', chain: 'BTC'});
};

module.exports.getBtcTxForRevoke = function() {
    //{status: 'waitingRevoke', chain: 'BTC'}
    return module.exports.getBtcTxHistory({status: 'waitingRevoke', chain: 'BTC'});
};

module.exports.getWbtcTxForRedeem = function() {
    //{status: 'waitingX', chain: 'WAN'}
    return module.exports.getBtcTxHistory({status: 'waitingX', chain: 'WAN'});
};

module.exports.getWbtcTxForRevoke = function() {
    //{status: 'waitingRevoke', chain: 'WAN'}
    return module.exports.getBtcTxHistory({status: 'waitingRevoke', chain: 'WAN'});
};

module.exports.getAllTransactions = function() {
    return module.exports.getBtcTxHistory({});
};

module.exports.getBtcTxHistory = function(option) {
    return ccUtil.getBtcWanTxHistory(option);
};

