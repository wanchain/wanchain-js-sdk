/**
 * Test mnemonic
 *
 * Copyright (c) 2019, Wanchain.
 * Liscensed under MIT license.
 */

const expect = require('chai').expect;

let param  = require('./input.json');
let setup  = require('../setup');
let hdUtil = require("../../../src/api/hdUtil");
let ccUtil = require("../../../src/api/ccUtil");
let util  = require("./util");

/**
 * Mnemonic test
 */
describe('Cross-chain lock', () => {
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
    it.skip('BTC->WBTC', async () => {
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
        }
    });
    it.skip('WBTC->BTC', async () => {
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

            let ret = await global.crossInvoker.invoke(null, dstChain, 'LOCK', input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
        }
    });
    it('ETH->WETH', async () => {
        let t = param.tests[lksuit];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.source != 'ETH' || tc.tokenPairID !== "1") {
                continue
            }
            console.log(`Runing: '${tc.desc}'`);

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.source, tc.tokenPairID);
            let dstChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.destination, tc.tokenPairID);

            console.log("Src: ", JSON.stringify(srcChain, null, 4));
            console.log("Dest: ", JSON.stringify(dstChain, null, 4));

            
            let mintQuota = await ccUtil.getMintQuota(tc.source, tc.tokenPairID, tc.smgId);
            console.log("mintQuota: ", mintQuota);

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

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', input, true);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
        }
    });
    it('WETH->ETH', async () => {
        let t = param.tests[lksuit];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.destination != 'ETH' || tc.tokenPairID !== "1") {
                continue
            }
            console.log(`Runing: '${tc.desc}'`);

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.source, tc.tokenPairID);
            let dstChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.destination, tc.tokenPairID);

            console.log("Src: ", JSON.stringify(srcChain, null, 4));
            console.log("Dest: ", JSON.stringify(dstChain, null, 4));

            let burnQuota = await ccUtil.getBurnQuota(tc.destination, tc.tokenPairID, tc.smgId);
            console.log("mintQuota: ", burnQuota);
            
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
        }
    });
    it('Fast Lock ETH->WETH', async () => {
        let t = param.tests[lksuit];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.source != 'ETH' || tc.tokenPairID !== "1") {
                continue
            }
            console.log(`Runing: '${tc.desc}'`);

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.source, tc.tokenPairID);
            let dstChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.destination, tc.tokenPairID);

            console.log("Src: ", JSON.stringify(srcChain, null, 4));
            console.log("Dest: ", JSON.stringify(dstChain, null, 4));

            let mintQuota = await ccUtil.getMintQuota(tc.source, tc.tokenPairID, tc.smgId);
            console.log("mintQuota: ", mintQuota);

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
        }
    });

    it('Fast Lock WETH->ETH', async () => {
        let t = param.tests[lksuit];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.destination != 'ETH' || tc.tokenPairID !== "1") {
                continue
            }
            console.log(`Runing: '${tc.desc}'`);

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.source, tc.tokenPairID);
            let dstChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.destination, tc.tokenPairID);

            console.log("Src: ", JSON.stringify(srcChain, null, 4));
            console.log("Dest: ", JSON.stringify(dstChain, null, 4));

            let burnQuota = await ccUtil.getBurnQuota(tc.destination, tc.tokenPairID, tc.smgId);
            console.log("mintQuota: ", burnQuota);

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
        }
    });
    it('DAI->WDAI', async () => {
        let t = param.tests[lksuit];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.source != 'ETH' || tc.tokenPairID !== "3" ) {
                continue
            }
            console.log(`Runing: '${tc.desc}'`);

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.source, tc.tokenPairID);
            let dstChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.destination, tc.tokenPairID);

            console.log("Src: ", JSON.stringify(srcChain, null, 4));
            console.log("Dest: ", JSON.stringify(dstChain, null, 4));

            let mintQuota = await ccUtil.getMintQuota(tc.source, tc.tokenPairID, tc.smgId);
            console.log("mintQuota: ", mintQuota);

            let input = {
                "from" : tc.from,
                "to" : tc.to,
                "amount" : tc.value,
                "gasPrice" : param.general.eth.gasPrice,
                "gasLimit" : param.general.eth.gasLimit,
                // "storeman" : param.general.storeman.dai,
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
        }
    });
    it('WDAI->DAI', async () => {
        let t = param.tests[lksuit];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.destination != 'ETH' || tc.tokenPairID !== "3" ) {
                continue
            }
            console.log(`Runing: '${tc.desc}'`);

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.source, tc.tokenPairID);
            let dstChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.destination, tc.tokenPairID);

            console.log("Src: ", JSON.stringify(srcChain, null, 4));
            console.log("Dest: ", JSON.stringify(dstChain, null, 4));

            let burnQuota = await ccUtil.getBurnQuota(tc.destination, tc.tokenPairID, tc.smgId);
            console.log("mintQuota: ", burnQuota);

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
        }
    });
    it('Fast Lock DAI->WDAI', async () => {
        let t = param.tests[lksuit];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.source != 'ETH' || tc.tokenPairID !== "3") {
                continue
            }
            console.log(`Runing: '${tc.desc}'`);

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.source, tc.tokenPairID);
            let dstChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.destination, tc.tokenPairID);

            console.log("Src: ", JSON.stringify(srcChain, null, 4));
            console.log("Dest: ", JSON.stringify(dstChain, null, 4));

            let mintQuota = await ccUtil.getMintQuota(tc.source, tc.tokenPairID, tc.smgId);
            console.log("mintQuota: ", mintQuota);

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
        }
    });

    it('Fast Lock WDAI->DAI', async () => {
        let t = param.tests[lksuit];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.destination != 'ETH' || tc.tokenPairID !== "3") {
                continue
            }
            console.log(`Runing: '${tc.desc}'`);

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.source, tc.tokenPairID);
            let dstChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.destination, tc.tokenPairID);

            console.log("Src: ", JSON.stringify(srcChain, null, 4));
            console.log("Dest: ", JSON.stringify(dstChain, null, 4));

            let burnQuota = await ccUtil.getBurnQuota(tc.destination, tc.tokenPairID, tc.smgId);
            console.log("mintQuota: ", burnQuota);

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
        }
    });
    it('WAN->WAN@eth', async () => {
        let t = param.tests[lksuit];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.source != 'WAN' || tc.tokenPairID !== "2") {
                continue
            }
            console.log(`Runing: '${tc.desc}'`);

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.source, tc.tokenPairID);
            let dstChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.destination, tc.tokenPairID);

            console.log("Src: ", JSON.stringify(srcChain, null, 4));
            console.log("Dest: ", JSON.stringify(dstChain, null, 4));

            let mintQuota = await ccUtil.getMintQuota(tc.source, tc.tokenPairID, tc.smgId);
            console.log("mintQuota: ", mintQuota);

            let input = {
                "from" : tc.from,
                "to" : tc.to,
                "amount" : tc.value,
                "gasPrice" : param.general.eth.gasPrice,
                "gasLimit" : param.general.eth.gasLimit,
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
        }
    });
    it('WAN@eth->WAN', async () => {
        let t = param.tests[lksuit];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.destination != 'WAN' || tc.tokenPairID !== "2") {
                continue
            }
            console.log(`Runing: '${tc.desc}'`);

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.source, tc.tokenPairID);
            let dstChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.destination, tc.tokenPairID);

            console.log("Src: ", JSON.stringify(srcChain, null, 4));
            console.log("Dest: ", JSON.stringify(dstChain, null, 4));

            let burnQuota = await ccUtil.getBurnQuota(tc.destination, tc.tokenPairID, tc.smgId);
            console.log("mintQuota: ", burnQuota);

            let input = {
                "from" : tc.from,
                "to" : tc.to,
                "amount" : tc.value,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
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
        }
    });
    it('Fast Lock WAN->WAN@eth', async () => {
        let t = param.tests[lksuit];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.source != 'WAN' || tc.tokenPairID !== "2") {
                continue
            }
            console.log(`Runing: '${tc.desc}'`);

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.source, tc.tokenPairID);
            let dstChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.destination, tc.tokenPairID);

            console.log("Src: ", JSON.stringify(srcChain, null, 4));
            console.log("Dest: ", JSON.stringify(dstChain, null, 4));

            let mintQuota = await ccUtil.getMintQuota(tc.source, tc.tokenPairID, tc.smgId);
            console.log("mintQuota: ", mintQuota);

            let input = {
                "from" : tc.from,
                "to" : tc.to,
                "amount" : tc.value,
                "gasPrice" : param.general.eth.gasPrice,
                "gasLimit" : param.general.eth.gasLimit,
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
        }
    });

    it('Fast Lock WAN@eth->WAN', async () => {
        let t = param.tests[lksuit];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.destination != 'WAN' || tc.tokenPairID !== "2") {
                continue
            }
            console.log(`Runing: '${tc.desc}'`);

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.source, tc.tokenPairID);
            let dstChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.destination, tc.tokenPairID);

            console.log("Src: ", JSON.stringify(srcChain, null, 4));
            console.log("Dest: ", JSON.stringify(dstChain, null, 4));

            let burnQuota = await ccUtil.getBurnQuota(tc.destination, tc.tokenPairID, tc.smgId);
            console.log("mintQuota: ", burnQuota);

            let input = {
                "from" : tc.from,
                "to" : tc.to,
                "amount" : tc.value,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
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
        }
    });
    it('FNX->wanFNX@eth', async () => {
        let t = param.tests[lksuit];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.source != 'WAN' || tc.tokenPairID !== "4" ) {
                continue
            }
            console.log(`Runing: '${tc.desc}'`);

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.source, tc.tokenPairID);
            let dstChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.destination, tc.tokenPairID);

            console.log("Src: ", JSON.stringify(srcChain, null, 4));
            console.log("Dest: ", JSON.stringify(dstChain, null, 4));

            let mintQuota = await ccUtil.getMintQuota(tc.source, tc.tokenPairID, tc.smgId);
            console.log("mintQuota: ", mintQuota);

            let input = {
                "from" : tc.from,
                "to" : tc.to,
                "amount" : tc.value,
                "gasPrice" : param.general.eth.gasPrice,
                "gasLimit" : param.general.eth.gasLimit,
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
        }
    });
    it('wanFNX@eth->FNX', async () => {
        let t = param.tests[lksuit];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.destination != 'WAN' || tc.tokenPairID !== "4" ) {
                continue
            }
            console.log(`Runing: '${tc.desc}'`);

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.source, tc.tokenPairID);
            let dstChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.destination, tc.tokenPairID);

            console.log("Src: ", JSON.stringify(srcChain, null, 4));
            console.log("Dest: ", JSON.stringify(dstChain, null, 4));

            let burnQuota = await ccUtil.getBurnQuota(tc.destination, tc.tokenPairID, tc.smgId);
            console.log("mintQuota: ", burnQuota);

            let input = {
                "from" : tc.from,
                "to" : tc.to,
                "amount" : tc.value,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
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
        }
    });
    it('Fast Lock FNX->wanFNX@eth', async () => {
        let t = param.tests[lksuit];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.source != 'WAN' || tc.tokenPairID !== "4") {
                continue
            }
            console.log(`Runing: '${tc.desc}'`);

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.source, tc.tokenPairID);
            let dstChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.destination, tc.tokenPairID);

            console.log("Src: ", JSON.stringify(srcChain, null, 4));
            console.log("Dest: ", JSON.stringify(dstChain, null, 4));

            let mintQuota = await ccUtil.getMintQuota(tc.source, tc.tokenPairID, tc.smgId);
            console.log("mintQuota: ", mintQuota);

            let input = {
                "from" : tc.from,
                "to" : tc.to,
                "amount" : tc.value,
                "gasPrice" : param.general.eth.gasPrice,
                "gasLimit" : param.general.eth.gasLimit,
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
        }
    });

    it('Fast Lock wanFNX@eth->FNX', async () => {
        let t = param.tests[lksuit];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.destination != 'WAN' || tc.tokenPairID !== "4") {
                continue
            }
            console.log(`Runing: '${tc.desc}'`);

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.source, tc.tokenPairID);
            let dstChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, tc.destination, tc.tokenPairID);

            console.log("Src: ", JSON.stringify(srcChain, null, 4));
            console.log("Dest: ", JSON.stringify(dstChain, null, 4));

            let burnQuota = await ccUtil.getBurnQuota(tc.destination, tc.tokenPairID, tc.smgId);
            console.log("mintQuota: ", burnQuota);

            let input = {
                "from" : tc.from,
                "to" : tc.to,
                "amount" : tc.value,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
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
        }
    });
});

