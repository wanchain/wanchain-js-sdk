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

let ethlocklist = {};
let wethlocklist = {};
let ethredeemlist = {};
let wethredeemlist = {};

let myself={};

/**
 * Cross transaction test
 */
describe('Cross-chain ETH', () => {
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
        // setup.shutdown();
    });

    it.skip('Lock ETH->WETH', async () => {
        let t = param.tests[lksuit];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.source != 'ETH' || tc.tokenPairID !== "1") {
                continue
            }
            console.log(`Runing: '${tc.desc}'`);

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.source, tc.tokenPairID);
            let dstChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.destination, tc.tokenPairID);

            let input = {
                "from" : tc.from,
                "to" : tc.to,
                "amount" : tc.value,
                "gasPrice" : param.general.eth.gasPrice,
                "gasLimit" : param.general.eth.gasLimit,
                // "storeman" : param.general.storeman.eth,
                // "txFeeRatio": param.general.txFeeRatio
                "storeman": tc.smgId,
                "tokenPairID": tc.tokenPairID,
                "crossType": "HTLC"
            }

            if (tc.hasOwnProperty('password')) {
                input.password = tc.password;
            }

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;

            util.addTxListByLockHash(ret.result, "BuddyLocked", ethlocklist);
        }
    });

    it.skip('Lock WETH->ETH', async () => {
        let t = param.tests[lksuit];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.destination != 'ETH' || tc.tokenPairID !== "1") {
                continue
            }
            console.log(`Runing: '${tc.desc}'`);

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.source, tc.tokenPairID);
            let dstChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.destination, tc.tokenPairID);

            let input = {
                "from" : tc.from,
                "to" : tc.to,
                "amount" : tc.value,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                // "storeman" : param.general.storeman.weth,
                // "txFeeRatio": param.general.txFeeRatio
                "storeman": tc.smgId,
                "tokenPairID": tc.tokenPairID,
                "crossType": "HTLC"
            }

            if (tc.hasOwnProperty('password')) {
                input.password = tc.password;
            }

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;

            util.addTxListByLockHash(ret.result, "BuddyLocked", wethlocklist);
        }
    });

    it.skip('Redeem ETH->WETH', async () => {
        let toRedeemRecords = await util.getRedeemTxList(ethlocklist);
        expect(toRedeemRecords.length).to.be.above(0);

        for (let i in toRedeemRecords) {
            let record = toRedeemRecords[i];
            console.log("Redeem ETH->WETH hashX:", record.hashX);

            let input = {};
            input.x       = ccUtil.hexAdd0x(record.x);
            input.hashX   = record.hashX; // use hashX to get record
            input.gasPrice= param.general.wan.gasPrice;
            input.gasLimit= param.general.wan.gasLimit;
            input.tokenPairID = record.tokenPairID;

            let srcChain = ccUtil.getSrcChainNameByContractAddr(record.srcChainAddr, record.srcChainType, record.tokenPairID);
            let dstChain = ccUtil.getSrcChainNameByContractAddr(record.srcChainAddr, record.dstChainType, record.tokenPairID);

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;

            util.addTxListByLockHash(record.lockTxHash, "Redeemed", ethredeemlist);
        }
        let chkfun = util.checkCCtx.bind(myself, ethredeemlist, util.getCCTxByLockTxHash);
        await util.waitAndCheckCondition(chkfun);
    });

    it.skip('Redeem WETH->ETH', async () => {
        //let toRedeemRecords = util.getWethTxForRedeem();
        let toRedeemRecords = await util.getRedeemTxList(wethlocklist);
        expect(toRedeemRecords.length).to.be.above(0);

        for (let i in toRedeemRecords) {
            let record = toRedeemRecords[i];
            console.log("Redeem WETH->ETH hashX:", record.hashX);

            let input = {};
            input.x       = ccUtil.hexAdd0x(record.x);
            input.hashX   = record.hashX; // use hashX to get record
            input.gasPrice= param.general.eth.gasPrice;
            input.gasLimit= param.general.eth.gasLimit;

            let srcChain = ccUtil.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.source, tc.tokenPairID);
            let dstChain = ccUtil.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.destination, tc.tokenPairID);

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;

            util.addTxListByLockHash(record.lockTxHash, "Redeemed", wethredeemlist);
        }
        let chkfun = util.checkCCtx.bind(myself, wethredeemlist, util.getCCTxByLockTxHash);
        await util.waitAndCheckCondition(chkfun);

    });

    it.skip('Fast Lock ETH->WETH', async () => {
        let t = param.tests[lksuit];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.source != 'ETH' || tc.tokenPairID !== "1") {
                continue
            }
            console.log(`Runing: '${tc.desc}'`);

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.source, tc.tokenPairID);
            let dstChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.destination, tc.tokenPairID);

            let input = {
                "from" : tc.from,
                "to" : tc.to,
                "amount" : tc.value,
                "gasPrice" : param.general.eth.gasPrice,
                "gasLimit" : param.general.eth.gasLimit,
                // "storeman" : param.general.storeman.eth,
                // "txFeeRatio": param.general.txFeeRatio
                "storeman": tc.smgId,
                "tokenPairID": tc.tokenPairID,
                "crossType": "FAST"
            }

            if (tc.hasOwnProperty('password')) {
                input.password = tc.password;
            }

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;

            util.addTxListByLockHash(ret.result, "BuddyLocked", ethlocklist);
        }
    });

    it.skip('Fast Lock WETH->ETH', async () => {
        let t = param.tests[lksuit];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.destination != 'ETH' || tc.tokenPairID !== "1") {
                continue
            }
            console.log(`Runing: '${tc.desc}'`);

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.source, tc.tokenPairID);
            let dstChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.destination, tc.tokenPairID);

            let input = {
                "from" : tc.from,
                "to" : tc.to,
                "amount" : tc.value,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                // "storeman" : param.general.storeman.weth,
                // "txFeeRatio": param.general.txFeeRatio
                "storeman": tc.smgId,
                "tokenPairID": tc.tokenPairID,
                "crossType": "FAST"
            }

            if (tc.hasOwnProperty('password')) {
                input.password = tc.password;
            }

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;

            util.addTxListByLockHash(ret.result, "BuddyLocked", wethlocklist);
        }
    });
});

