
/**
 * Test OpenStoreman transaction
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

describe('HD wallet OpenStoreman transaction test', () => {
    let password = param.hd.password;
    let mnemonic = param.hd.mnemonic.revealed;
    let caseOpenStoreman = "OpenStoreman";

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

        let testAdd = util.getAddressFromInt(5);
        console.log("openStoreman testcase", testAdd);
    });
    after(async () => {
        // setup.shutdown();
    });
    it('Delegate in', async () => {
        let t = param.tests[caseOpenStoreman];
        let action= 'delegateIn'

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
                "wAddr" : tc.wAddr,
                "amount" : tc.amount,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                "BIP44Path" : tc.path,
                "walletID" : tc.wid
            }

            let ret = await global.crossInvoker.invokeOpenStoremanTrans(action, input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
        }
    });
    it.skip('Delegate out', async () => {
        let t = param.tests[caseOpenStoreman];
        let action= 'delegateOut'

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
                "wAddr" : tc.wAddr,
                "amount" : 0,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                "BIP44Path" : tc.path,
                "walletID" : tc.wid
            }

            let ret = await global.crossInvoker.invokeOpenStoremanTrans(action, input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
        }
    });
    it.skip('Delegate Claim', async () => {
        let t = param.tests[caseOpenStoreman];
        let action= 'delegateClaim'

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
                "wAddr" : tc.wAddr,
                "amount" : 0,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                "BIP44Path" : tc.path,
                "walletID" : tc.wid
            }

            let ret = await global.crossInvoker.invokeOpenStoremanTrans(action, input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
        }
    });
    it.skip('Stake In', async () => {
        let t = param.tests[caseOpenStoreman];
        let action= 'stakeIn'

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.action != action) {
                continue
            }

            console.log(`Runing: '${tc.desc}'`);

            // 1. Get from address from wallet
            let addr = await hdUtil.getAddress(tc.wid, 'WAN', tc.path);
            console.log(`Address for '${tc.path}': '0x${addr.address}'`);

            // {
            //     "pubKey": '02b99aedc223e658e9cabc371521611e4249357512d0a655918116689013ae80a1', 
            //     "address": '67e3b428acbc3aa2fd38813f65dafbd5af97c6d5', 
            //     "waddress": '02B99aEdC223e658e9CaBc371521611E4249357512D0…32A7fc3C51C461e373AEE5764Bab9E823c7eeEef386'
            // }

            let input = {
                "from" : '0x' + addr.address,
                "groupId" : tc.groupId,
                "wPk" : tc.wPk,
                "enodeID" : tc.enodeID,
                "delegateFee" : tc.delegateFee,
                "amount" : tc.amount,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                "BIP44Path" : tc.path,
                "walletID" : tc.wid
            }

            let ret = await global.crossInvoker.invokeOpenStoremanTrans(action, input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
        }
    });
    it.skip('Stake Append', async () => {
        let t = param.tests[caseOpenStoreman];
        let action= 'stakeAppend'

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
                "wAddr" : tc.wAddr,
                "amount" : tc.amount,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                "BIP44Path" : tc.path,
                "walletID" : tc.wid
            }

            let ret = await global.crossInvoker.invokeOpenStoremanTrans(action, input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
        }
    });
    it.skip('Stake Out', async () => {

        let t = param.tests[caseOpenStoreman];
        let action= 'stakeOut'

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
                "wAddr" : tc.wAddr,
                "amount" : tc.amount,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                "BIP44Path" : tc.path,
                "walletID" : tc.wid
            }

            let ret = await global.crossInvoker.invokeOpenStoremanTrans(action, input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
        }
    });
    it.skip('Stake Claim', async () => {
        let t = param.tests[caseOpenStoreman];
        let action= 'stakeClaim'

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
                "wAddr" : tc.wAddr,
                "amount" : tc.amount,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                "BIP44Path" : tc.path,
                "walletID" : tc.wid
            }

            let ret = await global.crossInvoker.invokeOpenStoremanTrans(action, input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
        }
    });

});
