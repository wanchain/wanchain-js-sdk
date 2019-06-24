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

let dailocklist = {};
let wdailocklist = {};
let dairedeemlist = {};
let wdairedeemlist = {};

let myself={};

/**
 * Cross transaction test
 */
describe('Cross-chain DAI', () => {
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

    it('Lock DAI->WDAI', async () => {
        let t = param.tests[lksuit];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.source != 'ETH' || tc.tokenScAddr == undefined) {
                continue
            }
            console.log(`Runing: '${tc.desc}'`);

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.source);
            let dstChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.destination, tc.destination);

            let input = {
                "from" : tc.from,
                "to" : tc.to,
                "amount" : tc.value,
                "gasPrice" : param.general.eth.gasPrice,
                "gasLimit" : param.general.eth.gasLimit,
                "storeman" : param.general.storeman.dai,
                "txFeeRatio": param.general.txFeeRatio
            }

            if (tc.hasOwnProperty('password')) {
                input.password = tc.password;
            }

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;

            util.addTxListByLockHash(ret.result, "BuddyLocked", dailocklist);
        }
    });

    it('Lock WDAI->DAI', async () => {
        let t = param.tests[lksuit];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.destination != 'ETH' || tc.tokenScAddr == undefined) {
                continue
            }
            console.log(`Runing: '${tc.desc}'`);

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.source, tc.source);
            let dstChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.destination);

            let input = {
                "from" : tc.from,
                "to" : tc.to,
                "amount" : tc.value,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                "storeman" : param.general.storeman.weth,
                "txFeeRatio": param.general.txFeeRatio
            }

            if (tc.hasOwnProperty('password')) {
                input.password = tc.password;
            }

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;

            util.addTxListByLockHash(ret.result, "BuddyLocked", wdailocklist);
        }
    });

    it('Redeem DAI->WDAI', async () => {
        let toRedeemRecords = await util.getRedeemTxList(dailocklist);
        expect(toRedeemRecords.length).to.be.above(0);

        for (let i in toRedeemRecords) {
            let record = toRedeemRecords[i];
            console.log("Redeem DAI->WDAI hashX:", record.hashX);

            let input = {};
            input.x       = ccUtil.hexAdd0x(record.x);
            input.hashX   = record.hashX; // use hashX to get record
            input.gasPrice= param.general.wan.gasPrice;
            input.gasLimit= param.general.wan.gasLimit;

            let srcChain = ccUtil.getSrcChainNameByContractAddr(record.srcChainAddr,'ETH');
            let dstChain = ccUtil.getSrcChainNameByContractAddr('WAN','WAN');

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;

            util.addTxListByLockHash(record.lockTxHash, "Redeemed", dairedeemlist);
        }
        let chkfun = util.checkCCtx.bind(myself, dairedeemlist, util.getCCTxByLockTxHash);
        await util.waitAndCheckCondition(chkfun);
    });

    it('Redeem WDAI->DAI', async () => {
        //let toRedeemRecords = util.getWethTxForRedeem();
        let toRedeemRecords = await util.getRedeemTxList(wdailocklist);
        expect(toRedeemRecords.length).to.be.above(0);

        for (let i in toRedeemRecords) {
            let record = toRedeemRecords[i];
            console.log("Redeem WDAI->DAI hashX:", record.hashX);

            let input = {};
            input.x       = ccUtil.hexAdd0x(record.x);
            input.hashX   = record.hashX; // use hashX to get record
            input.gasPrice= param.general.eth.gasPrice;
            input.gasLimit= param.general.eth.gasLimit;

            let srcChain = ccUtil.getSrcChainNameByContractAddr('WAN','WAN');
            let dstChain = ccUtil.getSrcChainNameByContractAddr(record.dstChainAddr,'ETH');

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;

            util.addTxListByLockHash(record.lockTxHash, "Redeemed", wdairedeemlist);
        }
        let chkfun = util.checkCCtx.bind(myself, wdairedeemlist, util.getCCTxByLockTxHash);
        await util.waitAndCheckCondition(chkfun);

    });
});

