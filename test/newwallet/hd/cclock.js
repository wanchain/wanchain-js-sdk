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

        try {
            // let result = await ccUtil.getReadyOpenStoremanGroupList();
            // const bitcoin   = require('bitcoinjs-lib');
            // let a = Math.floor(Date.now() / 1000);
            // let b = a + global.aaron;
            // let c = bitcoin.script.number.encode(b);
            // console.log(a, b, c);
            
            // let result = await ccUtil.estimateSmartFee();
            // console.log("result is ", result);

            // let storemanGroup = await ccUtil.getReadyOpenStoremanGroupList();
            // console.log("storemanGroupList result is ", storemanGroup);

            let tokenPairs = await ccUtil.getTokenPairs();
            console.log("tokenPairs result is", tokenPairs);

            // let groupId = "0x0000000000000000000000000000000000000000696e7465726e616c5f303035";
            // let addr = await ccUtil.getBtcLockAccount(groupId);
            // console.log("smg addr is", addr);
            // process.exit();
        } catch (err) {
            console.log("err is ", err)
        }


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

            if (tc.source != 'BTC'|| tc.tokenPairID !== "15") {
                continue
            }

            console.log(`Runing: '${tc.desc}'`);

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr('0x0000000000000000000000000000000000000000', tc.source);
            let dstChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.destination, tc.destination);

            let input = {
                "from" : tc.from,
                "tokenPairID": tc.tokenPairID,
                "value" : tc.value,
                "feeRate" : param.general.feeRate,
                "changeAddress" : tc.changeAddr,
                // "smgBtcAddr" : param.general.storeman.btc,
                "storeman" : tc.smgId,
                "to" : tc.to,
                // "wanAddress" : tc.to,
                // "gasPrice" : param.general.wan.gasPrice,
                // "gas" : param.general.wan.gasLimit,
                "crossType": "FAST"
            }

            if (tc.hasOwnProperty('password')) {
                input.password = tc.password;
            }

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', input, true);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
        }
    });
    it('WBTC->BTC', async () => {
        let t = param.tests[lksuit];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.destination != 'BTC'|| tc.tokenPairID !== "15") {
                continue
            }
            console.log(`Runing: '${tc.desc}'`);

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr('0x89a3e1494bc3db81dadc893ded7476d33d47dcbd', tc.source);
            let dstChain = global.crossInvoker.getSrcChainNameByContractAddr('0x0000000000000000000000000000000000000000', tc.destination);

            // let value = ccUtil.calculateLocWanFeeWei(tc.value * 100000000, global.btc2WanRatio, param.general.txFeeRatio);
            let input = {
                "from" : tc.from,
                "tokenPairID": tc.tokenPairID,
                "amount" : tc.value,
                // "value" : value,
                // "storeman" : param.general.storeman.wbtc,
                "storeman" : tc.smgId,
                "to" : tc.to,
                // "crossAddr" : tc.to,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                "crossType": "FAST"
            }

            if (tc.hasOwnProperty('password')) {
                input.password = tc.password;
            }

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', input, true);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
        }
    });
    it.skip('ETH->WETH', async () => {
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

            
            // let mintQuota = await ccUtil.getMintQuota(tc.source, tc.tokenPairID, tc.smgId);
            // console.log("mintQuota: ", mintQuota);

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
    it.skip('WETH->ETH', async () => {
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

            // let burnQuota = await ccUtil.getBurnQuota(tc.source, tc.tokenPairID, tc.smgId);
            // console.log("mintQuota: ", burnQuota);
            
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

            console.log("Src: ", JSON.stringify(srcChain, null, 4));
            console.log("Dest: ", JSON.stringify(dstChain, null, 4));

            // let mintQuota = await ccUtil.getMintQuota(tc.source, tc.tokenPairID, tc.smgId);
            // console.log("mintQuota: ", mintQuota);

            let input = {
                "from" : tc.from,
                "to" : tc.to,
                // "to" : "0x393E86756d8d4CF38493CE6881eb3A8f2966Bb27",
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

            console.log("Src: ", JSON.stringify(srcChain, null, 4));
            console.log("Dest: ", JSON.stringify(dstChain, null, 4));

            // let burnQuota = await ccUtil.getBurnQuota(tc.source, tc.tokenPairID, tc.smgId);
            // console.log("mintQuota: ", burnQuota);

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
    it.skip('DAI->WDAI', async () => {
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

            // let mintQuota = await ccUtil.getMintQuota(tc.source, tc.tokenPairID, tc.smgId);
            // console.log("mintQuota: ", mintQuota);

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

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', input, false);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
        }
    });
    it.skip('WDAI->DAI', async () => {
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

            // let burnQuota = await ccUtil.getBurnQuota(tc.source, tc.tokenPairID, tc.smgId);
            // console.log("mintQuota: ", burnQuota);

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
    it.skip('Fast Lock DAI->WDAI', async () => {
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

            // let mintQuota = await ccUtil.getMintQuota(tc.source, tc.tokenPairID, tc.smgId);
            // console.log("mintQuota: ", mintQuota);

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

    it.skip('Fast Lock WDAI->DAI', async () => {
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

            // let burnQuota = await ccUtil.getBurnQuota(tc.source, tc.tokenPairID, tc.smgId);
            // console.log("mintQuota: ", burnQuota);

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
    it.skip('WAN->WAN@eth', async () => {
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

            // let mintQuota = await ccUtil.getMintQuota(tc.source, tc.tokenPairID, tc.smgId);
            // console.log("mintQuota: ", mintQuota);

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
    it.skip('WAN@eth->WAN', async () => {
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

            // let burnQuota = await ccUtil.getBurnQuota(tc.source, tc.tokenPairID, tc.smgId);
            // console.log("mintQuota: ", burnQuota);

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
    it.skip('Fast Lock WAN->WAN@eth', async () => {
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

            // let mintQuota = await ccUtil.getMintQuota(tc.source, tc.tokenPairID, tc.smgId);
            // console.log("mintQuota: ", mintQuota);

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
            // input = {
            //     "from" : "0x67e3b428acbc3aa2fd38813f65dafbd5af97c6d5",
            //     "to" : "0xded23dd19136574fce6b4ab4ea76395c4088a033",
            //     "amount" : tc.value,
            //     "gasPrice" : param.general.eth.gasPrice,
            //     "gasLimit" : param.general.eth.gasLimit,
            //     "storeman": tc.smgId,
            //     "tokenPairID": tc.tokenPairID,
            //     "crossType": "FAST"
            // }

            if (tc.hasOwnProperty('password')) {
                input.password = tc.password;
            }

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', input, true);
            console.log(JSON.stringify(ret, null, 4));
            // expect(ret.code).to.be.ok;
        }
    });

    it.skip('Fast Lock WAN@eth->WAN', async () => {
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

            // let burnQuota = await ccUtil.getBurnQuota(tc.source, tc.tokenPairID, tc.smgId);
            // console.log("mintQuota: ", burnQuota);

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
    it.skip('FNX->wanFNX@eth', async () => {
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

            // let mintQuota = await ccUtil.getMintQuota(tc.source, tc.tokenPairID, tc.smgId);
            // console.log("mintQuota: ", mintQuota);

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

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', input, false);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
        }
    });
    it.skip('wanFNX@eth->FNX', async () => {
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

            // let burnQuota = await ccUtil.getBurnQuota(tc.source, tc.tokenPairID, tc.smgId);
            // console.log("mintQuota: ", burnQuota);

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
    it.skip('Fast Lock FNX->wanFNX@eth', async () => {
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

            // let mintQuota = await ccUtil.getMintQuota(tc.source, tc.tokenPairID, tc.smgId);
            // console.log("mintQuota: ", mintQuota);

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

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', input, true);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
        }
    });

    it.skip('Fast Lock wanFNX@eth->FNX', async () => {
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

            // let burnQuota = await ccUtil.getBurnQuota(tc.source, tc.tokenPairID, tc.smgId);
            // console.log("mintQuota: ", burnQuota);

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

