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
let ccUtil = require("../../../src/api/ccUtil");
let util  = require("./util");

/**
 * Mnemonic test
 */
describe('Cross-chain redeem', () => {
    let password = param.hd.password;
    let mnemonic = param.hd.mnemonic.revealed;
    let lksuit = "CC-LOCK";

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
    it('BTC->WBTC', async () => {
        let toRedeemRecords = util.getBtcTxForRedeem();
        expect(toRedeemRecords.length).to.be.above(0);

        let record = toRedeemRecords[0];
        console.log(JSON.stringify(record, null, 4));

        let input = {};
        input.x        = ccUtil.hexAdd0x(record.x);
        input.hashX    = ccUtil.hexTrip0x(record.HashX); // use hashX to get record
        input.gas      = param.general.gasLimit;
        input.gasPrice = param.general.gasPrice;

        let srcChain = ccUtil.getSrcChainNameByContractAddr('BTC','BTC');
        let dstChain = ccUtil.getSrcChainNameByContractAddr('WAN','WAN');

        ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', input);
        console.log(JSON.stringify(ret, null, 4));
        expect(ret.code).to.be.ok;
    });
});

