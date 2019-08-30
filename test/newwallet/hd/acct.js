/**
 * Test account
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
 * User account test
 */
describe('Account db test', () => {
    let password = param.hd.password;
    let strength = param.hd.mnemonic.strength;
    let mnemonic = param.hd.mnemonic.revealed;

    let opt = {
        "importMnemonic" : true,
        "mnemonic" : mnemonic,
        "generateMnemonic" : false,
        "enableLedger"  : false,
        "enableRawkey"  : false,
        "enableKeystore": false
    };

    let caseact = "USR-ACCT";

    before(async () => {
        await setup.init();

        if (hdUtil.hasMnemonic()) {
            console.log("Wallet already has mnemonic, delete it first");
            hdUtil.deleteMnemonic(password);

            hdUtil.importMnemonic(mnemonic, password);

            expect(hdUtil.hasMnemonic()).to.be.ok;
        }
        util.initHDWallet(password, null, opt);

        let t = param.tests[caseact];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];
            hdUtil.deleteUserAccount(tc.wid, tc.path);
        }
    });
    after(async () => {
        let t = param.tests[caseact];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];
            hdUtil.deleteUserAccount(tc.wid, tc.path);
        }

        setup.shutdown();
    });
    it('User accout test', async () => {
        let t = param.tests[caseact];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];
            console.log(`Running '${tc.desc}', path=${tc.path}...`);
            let attr = {
                 name : tc.name
            }
            // Create
            expect(hdUtil.createUserAccount(tc.wid, tc.path, attr)).to.be.ok;
            // Read
            let ret = hdUtil.getUserAccount(tc.wid, tc.path);
            expect(ret.name).to.equal(tc.name);
            // Update
            let name = tc.name+"new";
            attr.newname = name;
            expect(hdUtil.updateUserAccount(tc.wid, tc.path, attr)).to.be.ok;
            expect(hdUtil.getUserAccount(tc.wid, tc.path).newname).to.equal(name);

            // Delete
            if (tc.delete) {
                hdUtil.deleteUserAccount(tc.wid, tc.path);
            }

        }

        let acct = hdUtil.getUserAccountForChain(0);
        console.log(JSON.stringify(acct, null, 4))
    });
});

