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
describe('Mnemonic test', () => {
    let password = param.hd.password;
    let strength = param.hd.mnemonic.strength;

    let chksumlen = strength/32;
    let wordlength = (chksumlen + strength)/11;

    before(async () => {
        await setup.init();

        if (hdUtil.hasMnemonic()) {
            console.log("Wallet already has mnemonic, delete it first");
            hdUtil.deleteMnemonic(password);

            let has = hdUtil.hasMnemonic();
            expect(has).to.not.be.ok;
        }
    });
    after(async () => {
        setup.shutdown();
    });
    it('Generate mnemonic', async () => {
        let mnemonic = hdUtil.generateMnemonic(password, strength, true);
        console.log("Generated mnemonic: ", mnemonic);

        expect(mnemonic.split(" ").length).to.equal(wordlength);

        let has = hdUtil.hasMnemonic();
        expect(has).to.be.ok;
    });
    it('Import/Export mnemonic', async () => {
        let mnemonic = param.hd.mnemonic.revealed;

        if (hdUtil.hasMnemonic()) {
            hdUtil.deleteMnemonic(password);
        }

        let ret = hdUtil.importMnemonic(mnemonic, password);
        expect(ret).to.be.ok;

        let revealed = hdUtil.revealMnemonic(password);
        console.log(revealed);
        expect(revealed).to.equal(mnemonic);

    });
});

