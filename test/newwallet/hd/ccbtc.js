/**
 * ETH cross chain test
 *
 * Copyright (c) 2019, Wanchain.
 * Liscensed under MIT license.
 */
'use strict'

const expect = require('chai').expect;

let param  = require('./input.json');
let setup  = require('../setup');
let hdUtil = require("../../../src/api/hdUtil");
let ccUtil = require("../../../src/api/ccUtil");
let util  = require("./util");

let btclocklist = {};
let wbtclocklist = {};
let btcredeemlist = {};
let wbtcredeemlist = {};

let myself={};

let getBtcCCTxByLockNoticeTxHash = function(hash) {
    return util.getBtcTxHistory({"btcNoticeTxhash":hash});
};

let getBtcCCTxByLockTxHash = function(hash) {
    return util.getBtcTxHistory({"lockTxhash":hash});
};
/**
 * Cross transaction test
 */
describe('Cross-chain BTC', () => {
    let password = param.hd.password;
    let mnemonic = param.hd.mnemonic.revealed;
    let lksuit = "CC-LOCK";

    let opt = {
        "importMnemonic" : true,
        "mnemonic" : mnemonic,
        "generateMnemonic" : false,
        "enableLedger"  : false,
        "enableRawkey"  : true,
        "enableKeystore": false
    };

    before(async () => {
        await setup.init();

        if (hdUtil.hasMnemonic()) {
            console.log("Wallet already has mnemonic, delete it first");
            hdUtil.deleteMnemonic(password);

            hdUtil.importMnemonic(mnemonic, password);

            expect(hdUtil.hasMnemonic()).to.be.ok;
        }

        util.initHDWallet(password, null, opt);
    });
    after(async () => {
        setup.shutdown();
    });

    it('Lock BTC->WBTC', async () => {
        let t = param.tests[lksuit];
        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.source != 'BTC') {
                continue
            }

            console.log(`Runing: '${tc.desc}'`);

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.source, tc.source);
            let dstChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.destination, tc.destination);

            let input = {
                "from" : tc.from,
                "value" : tc.value,
                "feeRate" : param.general.feeRate,
                "changeAddress" : tc.changeAddr,
                "smgBtcAddr" : param.general.storeman.btc,
                "storeman" : param.general.storeman.wbtc,
                "wanAddress" : tc.to,
                "gasPrice" : param.general.wan.gasPrice,
                "gas" : param.general.wan.gasLimit
            }

            if (tc.hasOwnProperty('password')) {
                input.password = tc.password;
            }

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
            util.addTxListByLockHash(ccUtil.hexTrip0x(ret.result), "waitingX", btclocklist);
        }
    });

    it('Lock WBTC->BTC', async () => {
        let t = param.tests[lksuit];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.destination != 'BTC') {
                continue
            }
            console.log(`Runing: '${tc.desc}'`);

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.source, tc.source);
            let dstChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.destination, tc.destination);

            let value = ccUtil.calculateLocWanFeeWei(tc.value * 100000000, global.btc2WanRatio, param.general.txFeeRatio);
            let input = {
                "from" : tc.from,
                "amount" : tc.value,
                "value" : value,
                "storeman" : param.general.storeman.wbtc,
                "crossAddr" : tc.to,
                "gasPrice" : param.general.wan.gasPrice,
                "gas" : param.general.wan.gasLimit
            }

            if (tc.hasOwnProperty('password')) {
                input.password = tc.password;
            }

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;

            util.addTxListByLockHash(ccUtil.hexTrip0x(ret.result), "waitingX", wbtclocklist);
        }
    });

    it('Redeem BTC->WBTC', async () => {
        let toRedeemRecords = await util.getRedeemTxList(btclocklist, getBtcCCTxByLockNoticeTxHash);
        expect(toRedeemRecords.length).to.be.above(0);

        for (let i in toRedeemRecords) {
            let record = toRedeemRecords[i];
            console.log("Redeem BTC->WBTC hashX:", record.hashX);

            let input = {};
            input.x       = ccUtil.hexAdd0x(record.x);
            input.hashX   = record.hashX; // use hashX to get record
            input.gasPrice= param.general.wan.gasPrice;
            input.gasLimit= param.general.wan.gasLimit;

            let srcChain = ccUtil.getSrcChainNameByContractAddr('BTC','BTC');
            let dstChain = ccUtil.getSrcChainNameByContractAddr('WAN','WAN');

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;

            util.addTxListByLockHash(record.lockTxHash, "redeemFinished", btcredeemlist);
        }
        let chkfun = util.checkCCtx.bind(myself, btcredeemlist, getBtcCCTxByLockNoticeTxHash);
        await util.waitAndCheckCondition(chkfun);
    });

    it('Redeem WBTC->BTC', async () => {
        let toRedeemRecords = await util.getRedeemTxList(wbtclocklist, getBtcCCTxByLockTxHash);
        expect(toRedeemRecords.length).to.be.above(0);

        for (let i in toRedeemRecords) {
            let record = toRedeemRecords[i];
            console.log("Redeem WBTC->BTC hashX:", record.hashX);

            let input = {};
            input.x       = ccUtil.hexAdd0x(record.x);
            input.hashX   = record.hashX; // use hashX to get record
            input.feeHard = param.general.feeHard;

            let srcChain = ccUtil.getSrcChainNameByContractAddr('WAN','WAN');
            let dstChain = ccUtil.getSrcChainNameByContractAddr('BTC','BTC');

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;

            util.addTxListByLockHash(record.lockTxHash, "redeemFinished", wbtcredeemlist);
        }
        let chkfun = util.checkCCtx.bind(myself, wbtcredeemlist, getBtcCCTxByLockTxHash);
        await util.waitAndCheckCondition(chkfun);

    });
});

