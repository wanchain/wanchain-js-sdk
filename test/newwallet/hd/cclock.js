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
        setup.shutdown();
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
                "smgBtcAddr" : param.general.storemanBtc,
                "storeman" : param.general.storemanWan,
                "wanAddress" : tc.to,
                "gasPrice" : param.general.gasPrice,
                "gas" : param.general.gasLimit
            }

            if (tc.hasOwnProperty('password')) {
                input.password = tc.password;
            }

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
        }
    });
    it('WBTC->BTC', async () => {
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
                "storeman" : param.general.storemanWan,
                "crossAddr" : tc.to,
                "gasPrice" : param.general.gasPrice,
                "gas" : param.general.gasLimit
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

