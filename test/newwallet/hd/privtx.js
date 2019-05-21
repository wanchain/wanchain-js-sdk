
/**
 * Test private transaction
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
    let casepriv = "PRIV-WAN";

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
    it.skip('Send private transaction', async () => {
        let t = param.tests[casepriv];
        let action= 'SEND'

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.action != 'SEND') {
                continue
            }

            console.log(`Runing: '${tc.desc}'`);

            // 1. Get from address from wallet
            let addr = await hdUtil.getAddress(tc.wid, 'WAN', tc.path);
            console.log(`Address for '${tc.path}': '0x${addr.address}'`);

            let input = {
                "from" : '0x' + addr.address,
                "to" : tc.to,
                "amount" : tc.amount,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                "BIP44Path" : tc.path,
                "walletID" : tc.wid
            }

            let ret = await global.crossInvoker.invokePrivateTrans(action, input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
        }
    });
    it('Scan', async () => {
        let t = param.tests[casepriv];
        let action= 'SCAN'

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.action != 'SCAN') {
                continue
            }

            console.log(`Runing: '${tc.desc}'`);
            ccUtil.scanOTA(tc.wid, tc.path)
        }
    });
    it('Refund', async () => {
        let t = param.tests[casepriv];
        let action= 'REFUND'

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.action != 'REFUND') {
                continue
            }

            console.log(`Runing: '${tc.desc}'`);

            let addr = await hdUtil.getAddress(tc.wid, 'WAN', tc.path);

            let r = ccUtil.getOtaFunds(tc.wid, tc.path);
            console.log(`Got total '${r.length}' private tx!`);

            for (let i=0; i<r.length; i++) {
                let ota = r[i];

                let amount = ccUtil.weiToToken(ota.value)
                let input = {
                    "from" : '0x' + addr.address,
                    "amount" : amount,
                    "otaTxHash" : ota.txhash,
                    "OTA" : ota.toOTA,
                    "gasPrice" : param.general.wan.gasPrice,
                    "gasLimit" : param.general.wan.gasLimit,
                    "BIP44Path" : tc.path,
                    "walletID" : tc.wid
                }

                let ret = await global.crossInvoker.invokePrivateTrans(action, input);
                console.log(JSON.stringify(ret, null, 4));
            }
        }
    });
});
