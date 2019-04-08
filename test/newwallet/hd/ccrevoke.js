/**
 * Test mnemonic
 *
 * Copyright (c) 2019, Wanchain.
 * Liscensed under MIT license.
 */

const expect = require('chai').expect;

let param  = require('./input.json');
let setup  = require('../setup');
let ccUtil = require("../../../src/api/ccUtil");
let hdUtil = require("../../../src/api/hdUtil");
let util  = require("./util");

/**
 * Mnemonic test
 */
describe('Cross-chain revoke', () => {
    let password = param.hd.password;
    let mnemonic = param.hd.mnemonic.revealed;

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
    it('Revoke: BTC->WBTC', async () => {
        let toRevokeRecords = util.getBtcTxForRevoke();
        console.log(toRevokeRecords.length);
        expect(toRevokeRecords.length).to.be.above(0);

        let record = toRevokeRecords[0];
        console.log(JSON.stringify(record, null, 4));

        let input = {};

        input.hashX   = ccUtil.hexTrip0x(record.HashX); 
        input.feeHard = param.general.feeHard;
        input.from    = record.from;

        let srcChain = ccUtil.getSrcChainNameByContractAddr('BTC','BTC');
        let dstChain = ccUtil.getSrcChainNameByContractAddr('WAN','WAN');

        ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REVOKE', input);
        console.log(JSON.stringify(ret, null, 4));
        expect(ret.code).to.be.ok;
    });
});

