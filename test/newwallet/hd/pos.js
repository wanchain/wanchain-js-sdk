
/**
 * Test POS transaction
 *
 * Copyright (c) 2019, Wanchain.
 * Liscensed under MIT license.
 */

const expect = require('chai').expect;

let param  = require('./input.json');
let setup  = require('../setup');
let hdUtil = require("../../../src/api/hdUtil");
let ccUtil = require("../../../src/api/ccUtil");
let sdkUtil= require("../../../src/util/util");
let util  = require("./util");

describe('HD wallet private transaction test', () => {
    let password = param.hd.password;
    let mnemonic = param.hd.mnemonic.revealed;
    let casepos = "POS";

    let opt = {
        "importMnemonic" : true,
        "mnemonic" : mnemonic,
        "generateMnemonic" : false,
        "enableLedger"  : false,
        "enableRawkey"  : false,
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
    it.skip('Delegate in', async () => {
        let t = param.tests[casepos];
        let action= 'DELEGATEIN'

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.action != action) {
                continue
            }

            console.log(`Runing: '${tc.desc}'`);

            // 1. Get from address from wallet
            let addr = await hdUtil.getAddress(tc.wid, 'WAN', tc.path);
            console.log(`Address for '${tc.path}': '0x${addr.address}'`);

            let input = {
                "from" : '0x' + addr.address,
                "validatorAddr" : tc.validator,
                "amount" : tc.amount,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                "BIP44Path" : tc.path,
                "walletID" : tc.wid
            }

            let ret = await global.crossInvoker.PosDelegateIn(input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
        }
    });
    it('Delegate out', async () => {
        let t = param.tests[casepos];
        let action= 'DELEGATEOUT'

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.action != action) {
                continue
            }

            console.log(`Runing: '${tc.desc}'`);

            // 1. Get from address from wallet
            let addr = await hdUtil.getAddress(tc.wid, 'WAN', tc.path);
            console.log(`Address for '${tc.path}': '0x${addr.address}'`);

            let input = {
                "from" : '0x' + addr.address,
                "validatorAddr" : tc.validator,
                "amount" : 0,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                "BIP44Path" : tc.path,
                "walletID" : tc.wid
            }

            let ret = await global.crossInvoker.PosDelegateOut(input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
        }
    });
});
