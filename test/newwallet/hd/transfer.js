/**
 * Test transfer
 *
 * Copyright (c) 2019, Wanchain.
 * Liscensed under MIT license.
 */

const expect = require('chai').expect;

let param  = require('./input.json');
let setup  = require('../setup');
let hdUtil = require("../../../src/api/hdUtil");
let util  = require("./util");

/**
 * Transaction test
 */
describe('HD wallet transaction test', () => {
    let password = param.hd.password;
    let mnemonic = param.hd.mnemonic.revealed;
    let casewan = "TX-WAN";
    let casebtc = "TX-BTC";

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
        await util.checkRun();

        setup.shutdown();
    });
    it('Transfer WAN', async () => {
        let t = param.tests[casewan];
        let chain = t.chain || 'WAN';

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            asset = t.asset || 'WAN';

            console.log(`Runing: '${tc.desc}', asset - '${chain}:${asset}'`);

            // 1. Get from address from wallet
            let addr = await hdUtil.getAddress(tc.wid, chain, tc.path);
            console.log(`Address for '${tc.path}': '0x${addr.address}'`);

            let input = {
                "symbol" : asset,
                "from" : '0x' + addr.address,
                "to" : tc.to,
                "amount" : tc.amount,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                "BIP44Path" : tc.path,
                "walletID" : tc.wid
            }

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(asset, chain);
            console.log("Source chain: ", JSON.stringify(srcChain, null, 4));
            let ret = await global.crossInvoker.invokeNormalTrans(srcChain, input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;

            util.checkNormalTxStatus(ret.result, 'Success');

        }
    });
    it.skip('Transfer BTC', async () => {
        let t = param.tests[casebtc];
        let chain = t.chain || 'BTC';

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            console.log(`Runing: '${tc.desc}'`);

            let input = {
                "from" : tc.from,
                "to" : tc.to,
                "changeAddress" : t.changeAddr,
                "value" : tc.value, // Unit BTC?
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                "feeRate" : param.general.feeRate
            }

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(chain, chain);
            console.log("Source chain: ", JSON.stringify(srcChain, null, 4));
            let ret = await global.crossInvoker.invokeNormalTrans(srcChain, input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
        }
    });
});

