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
 * Mnemonic test
 */
describe('Mnemonic test', () => {
    let password = param.hd.password;
    let strength = param.hd.mnemonic.strength;
    let mnemonic = param.hd.mnemonic.revealed;

    let opt = {
        "importMnemonic" : true,
        "mnemonic" : mnemonic,
        "generateMnemonic" : false,
        "enableLedger"  : false,
        "enableRawkey"  : true,
        "enableKeystore": false
    };

    let caseact = "USR-ACCT";

    before(async () => {
        await setup.init();

        if (hdUtil.hasMnemonic()) {
            console.log("Wallet already has mnemonic, delete it first");
            hdUtil.deleteMnemonic(password);

            hdUtil.importMnemonic(mnemonic, password);

            expect(hdUtil.hasMnemonic()).to.not.be.ok;
        }
        util.initHDWallet(password, null, opt);

        let t = param.tests[caseact];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];
            hdUtil.deleteUserAccount(tc.wid, tc.path);
        }
    });
    after(async () => {
        setup.shutdown();
    });
    it('User accout test', async () => {
        let t = param.tests[caseact];

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];
            console.log(`Running '${tc.desc}', path=${tc.path}...`);
            // Create
            expect(hdUtil.createUserAccount(tc.wid, tc.path, tc.name)).to.be.ok;
            // Read
            let name = hdUtil.getUserAccount(tc.wid, tc.path);
            expect(name).to.equal(tc.name);
            // Update
            name = name+"new";
            expect(hdUtil.updateUserAccount(tc.wid, tc.path, name)).to.be.ok;
            expect(hdUtil.getUserAccount(tc.wid, tc.path)).to.equal(name);

            // Delete
            if (tc.delete) {
                hdUtil.deleteUserAccount(tc.wid, tc.path);
            }

        }

        let acct = hdUtil.getUserAccountForChain(0);
        console.log(JSON.stringify(acct, null, 4))
    });
});

