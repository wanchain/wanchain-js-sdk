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
let util  = require("./util");

/**
 * Mnemonic test
 */
describe('HD wallet get address test', () => {
    let password = param.hd.password;
    let mnemonic = param.hd.mnemonic.revealed;
    let casepath = "ADDR-1";
    let caserange = "ADDR-2";

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
    it('Get addresses by path', async () => {
        let t = param.tests[casepath];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];
            console.log(`Runing: '${tc.desc}'`);

            let addr = await hdUtil.getAddress(tc.wid, tc.chain, tc.path);

            console.log(addr);

            expect(addr.address).to.equal(tc.expected);

        }
    });
    it('Get addresses by range', async () => {
        let t = param.tests[caserange];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];
            console.log(`Runing: '${tc.desc}'`);

            let addr = await hdUtil.getAddress(tc.wid, tc.chain, tc.start, tc.end);

            expect(addr.addresses.length).to.equal(tc.end-tc.start);

            for (let j=0; j<tc.end-tc.start; j++) {
                let got = addr.addresses[j].address;
                let want = tc.expected[j];
                expect(got).to.equal(want);
            }

        }
    });
});

