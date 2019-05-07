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
        mnemonic = hdUtil.generateMnemonic(password, strength, true);
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
        await hdUtil.newKeyStoreWallet(password);
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

module.exports.getEthTxForRedeem = function() {
    //{'srcChainAddr' : 'ETH', 'srcChainType' : 'ETH'}
    let hist = module.exports.getCrossTxHistory({'srcChainAddr' : 'ETH', 'srcChainType' : 'ETH'});
    return hist.filter(r => { let f =ccUtil.canRedeem(r); return f.code; });
};

module.exports.getEthTxForRevoke = function() {
    //{'srcChainAddr' : 'ETH', 'srcChainType' : 'ETH'}
    let hist = module.exports.getCrossTxHistory({'srcChainAddr' : 'ETH', 'srcChainType' : 'ETH'});
    return hist.filter(r => { let f =ccUtil.canRevoke(r); return f.code; });
};

module.exports.getWethTxForRedeem = function() {
    //{'dstChainAddr' : 'ETH', 'dstChainType' : 'ETH'}
    let hist = module.exports.getCrossTxHistory({'dstChainAddr' : 'ETH', 'dstChainType' : 'ETH'});
    return hist.filter(r => { let f =ccUtil.canRedeem(r); return f.code; });
};

module.exports.getWethTxForRevoke = function() {
    //{'dstChainAddr' : 'ETH', 'dstChainType' : 'ETH'}
    let hist = module.exports.getCrossTxHistory({'dstChainAddr' : 'ETH', 'dstChainType' : 'ETH'});
    return hist.filter(r => { let f =ccUtil.canRevoke(r); return f.code; });
};

module.exports.getErc20TxForRedeem = function() {
    //{'srcChainAddr' : '0x...', 'srcChainType' : 'ETH'}
    let hist = module.exports.getCrossTxHistory({'srcChainType' : 'ETH'});
    return hist.filter(r => {
        if (r.srcChainAddr === 'ETH') {
            return false;
        }
        let f =ccUtil.canRedeem(r);
        return f.code; });
};

module.exports.getErc20TxForRevoke = function() {
    //{'srcChainAddr' : '0x...', 'srcChainType' : 'ETH'}
    let hist = module.exports.getCrossTxHistory({'srcChainType' : 'ETH'});
    return hist.filter(r => {
        if (r.srcChainAddr === 'ETH') {
            return false;
        }
        let f =ccUtil.canRevoke(r);
        return f.code; });
};

module.exports.getWErc20TxForRedeem = function() {
    //{'dstChainAddr' : '0x...', 'dstChainType' : 'ETH'}
    let hist = module.exports.getCrossTxHistory({'dstChainType' : 'ETH'});
    return hist.filter(r => {
        if (r.dstChainAddr === 'ETH') {
            return false;
        }
        let f =ccUtil.canRedeem(r);
        return f.code; });
};

module.exports.getWErc20TxForRevoke = function() {
    //{'dstChainAddr' : '0x...', 'dstChainType' : 'ETH'}
    let hist = module.exports.getCrossTxHistory({'dstChainType' : 'ETH'});
    return hist.filter(r => {
        if (r.dstChainAddr === 'ETH') {
            return false;
        }
        let f =ccUtil.canRevoke(r);
        return f.code; });
};

module.exports.getCrossTxHistory = function(option) {
    return global.wanDb.getItemAll('crossTrans', option)
};
