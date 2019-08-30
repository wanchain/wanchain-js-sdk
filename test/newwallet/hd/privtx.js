
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

let blockNo;
let scanned = {};

let scanCheck = function() {
    for (let k in scanned) {
        let s = scanned[k];
        let r = ccUtil.getOtaFunds(s.wid, s.path);
        for (let i=0; i<r.length; i++) {
            if (r[i].blockNo >= blockNo) {
                delete scanned[k]
                break
            }
        }

    }

    return Object.keys(scanned).length == 0
};

describe('HD wallet private transaction test', () => {
    //this.timeout(1800000);

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

        //blockNo = await ccUtil.getBlockNumber('WAN');
        blockNo = 3385282
        console.log("BlockNumber=", blockNo);
    });
    after(async () => {
        setup.shutdown();
    });
    it('Send private transaction', async () => {
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

            let toAddr = await hdUtil.getAddress(tc.to.wid, 'WAN', tc.to.path);
            console.log(`Waddress for '${tc.to.path}': '0x${toAddr.waddress}'`);

            let input = {
                "from" : '0x' + addr.address,
                "to" : '0x' + toAddr.waddress,
                "amount" : tc.amount,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                "BIP44Path" : tc.path,
                "walletID" : tc.wid
            }

            let ret = await global.crossInvoker.invokePrivateTrans(action, input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;

            util.checkNormalTxStatus(ret.result, 'Success');
        }
        await util.checkRun();
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

            scanned[sdkUtil.compositeWalletKey(tc.wid, tc.path)] = {
                "wid" : tc.wid,
                "path": tc.path
            };
        }

        await util.waitAndCheckCondition(scanCheck);
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
            expect(r.length).to.be.above(0);

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
                util.checkNormalTxStatus(ret.result, 'Success');
            }
        }

        await util.checkRun();
    });
});
