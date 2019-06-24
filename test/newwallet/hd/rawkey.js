/**
 * Test raw key wallet
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
 * Keystore test
 */
describe('Raw key wallet test', () => {
    let password = param.hd.password;
    let mnemonic = param.hd.mnemonic.revealed;
    let casekey = "RAW-KEY";

    let wid = 6;

    let opt = {
        "importMnemonic" : true,
        "mnemonic" : mnemonic,
        "generateMnemonic" : true,
        "enableLedger"  : false,
        "enableRawkey"  : true,
        "enableKeystore": true
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
        // clean up
        if (param.tests[casekey].truncateDb) {
            console.log("I'm going to truncte the table!");
            global.hdWalletDB.getRawKeyTable().truncate();
        }

        setup.shutdown();
    });
    it('Import key', async () => {
        let t = param.tests[casekey];

        let opt = {
            "password" : password,
            "chkfunc" : hdUtil.revealMnemonic
        }

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            console.log(`Runing: '${tc.desc}'`);
            let idx = hdUtil.importPrivateKey(tc.path, Buffer.from(tc.key, 'hex'), password);

            newpath = tc.path.substring(0, tc.path.lastIndexOf('/')+1).concat(idx);

            let priv = await  hdUtil.getWallet(wid).getPrivateKey(newpath, opt);
            expect(priv.toString('hex')).to.equal(tc.key);

            let addr = await hdUtil.getAddress(wid, tc.chain, newpath, opt);
            console.log("addr:", addr);
            expect(addr.address).to.equal(tc.address);
        }
    });
});

