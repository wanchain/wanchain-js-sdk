/**
 */

let param  = require('./input.json');
let hdUtil = require("../../../src/api/hdUtil");
let ccUtil = require("../../../src/api/ccUtil");
const ethutil = require("ethereumjs-util");

const expect = require('chai').expect;

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
    //{status: 'BuddyLocked', chain: 'BTC'}
    return module.exports.getBtcTxHistory({status: 'BuddyLocked', chain: 'BTC'});
};

module.exports.getBtcTxForRevoke = function() {
    //{status: 'BuddyLocked', chain: 'BTC'}
    return module.exports.getBtcTxHistory({status: 'BuddyLocked', chain: 'BTC'});
};

module.exports.getWbtcTxForRedeem = function() {
    //{status: 'BuddyLocked', chain: 'WAN'}
    return module.exports.getBtcTxHistory({status: 'BuddyLocked', chain: 'WAN'});
};

module.exports.getWbtcTxForRevoke = function() {
    //{status: 'BuddyLocked', chain: 'WAN'}
    return module.exports.getBtcTxHistory({status: 'BuddyLocked', chain: 'WAN'});
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

module.exports.getEosTxForRedeem = function() {
    //{'srcChainAddr' : '0x...', 'srcChainType' : 'EOS'}
    let hist = module.exports.getCrossTxHistory({'srcChainType' : 'EOS'});
    return hist.filter(r => {
        if (r.srcChainAddr === 'EOS') {
            return false;
        }
        let f =ccUtil.canRedeem(r);
        return f.code; });
};

module.exports.getEosTxForRevoke = function() {
    //{'srcChainAddr' : '0x...', 'srcChainType' : 'EOS'}
    let hist = module.exports.getCrossTxHistory({'srcChainType' : 'EOS'});
    return hist.filter(r => {
        if (r.srcChainAddr === 'EOS') {
            return false;
        }
        let f =ccUtil.canRevoke(r);
        return f.code; });
};

module.exports.getWEosTxForRedeem = function() {
    //{'dstChainAddr' : '0x...', 'dstChainType' : 'EOS'}
    let hist = module.exports.getCrossTxHistory({'dstChainType' : 'EOS'});
    return hist.filter(r => {
        if (r.dstChainAddr === 'EOS') {
            return false;
        }
        let f =ccUtil.canRedeem(r);
        return f.code; });
};

module.exports.getWEosTxForRevoke = function() {
    //{'dstChainAddr' : '0x...', 'dstChainType' : 'EOS'}
    let hist = module.exports.getCrossTxHistory({'dstChainType' : 'EOS'});
    return hist.filter(r => {
        if (r.dstChainAddr === 'EOS') {
            return false;
        }
        let f =ccUtil.canRevoke(r);
        return f.code; });
};

module.exports.getCrossTxHistory = function(option) {
    return global.wanDb.getItemAll('crossTrans', option)
};

module.exports.getNormalTxHistory = function(option) {
    return global.wanDb.getItem('normalTrans', option);
};
//
// Check monitor
//
var txWatchList = {};

module.exports.checkNormalTxStatus = function(txHash, wanted) {
    txWatchList[txHash] = wanted;
};

module.exports.checkRun = async function() {
    let f = function() {
        for (let k in txWatchList) {
            let r = exports.getNormalTxHistory({'txHash':k});
            expect(r).to.not.be.null;

            if (r.status == 'Sent') {
                continue
            }

            //console.log('Check tx: ', r);
            expect(r.status).to.equal(txWatchList[k]);

            delete txWatchList[k];
        }

        return Object.keys(txWatchList).length == 0
    }

    await exports.waitAndCheckCondition(f);
};

module.exports.checkCCtx = function(pendingMap, getTx) {
    let checked = 0;
    for (let k in pendingMap) {
        if (pendingMap[k].ok) {
            checked++;
            continue;
        }

        let txs = getTx(k);
        expect(txs).to.not.be.null;

        let r = txs[0];
        let s = r.status.toLowerCase();
        if (s.includes("fail")) {
            expect(false).to.be.ok;
        }

        if (r.status != pendingMap[k].expectedStatus) {
            continue
        }
        //delete pendingMap[k];
        checked++;
        pendingMap[k].ok = true;
    }

    return Object.keys(pendingMap).length == checked;
};

module.exports.getCCTxByLockTxHash = function(hash) {
    return exports.getCrossTxHistory({"lockTxHash":hash});
};

module.exports.addTxListByLockHash = function(lockTxHash, expected, list) {
    list[lockTxHash] = {
        "lockTxHash" : lockTxHash,
        "expectedStatus" : expected
    }
};

let myself={};
module.exports.getRedeemTxList = async function(list, getTxFunc=exports.getCCTxByLockTxHash) {
    let chkfun = exports.checkCCtx.bind(myself, list, getTxFunc);
    await exports.waitAndCheckCondition(chkfun);

    let txs = []
    for (let k in list) {
        //
        let r = getTxFunc(k);
        txs = txs.concat(r);
    }
    return txs
};

module.exports.waitAndCheckCondition = async function(chkcond) {
    let interval = 5000;

    while(true) {
        if (chkcond()) {
            console.log("Condition satified")
            return
        }
        await ccUtil.sleep(interval);
    }
}

module.exports.getAddressFromInt = function (i){
    let b = Buffer.alloc(32)
    b.writeUInt32BE(i,28)
    let pkb = ethutil.privateToPublic(b)
    //console.log("priv:", '0x'+b.toString('hex')) 
    let addr = '0x'+ethutil.pubToAddress(pkb).toString('hex')
    let pk = '0x'+pkb.toString('hex')
    //console.log("got address: ",addr)
    return {addr, pk, priv:b}
  }