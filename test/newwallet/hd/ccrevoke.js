/**
 * Test cross-chain revoke
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
        // setup.shutdown();
    });
    it.skip('Revoke: BTC->WBTC', async () => {
        let toRevokeRecords = util.getBtcTxForRevoke();
        //expect(toRevokeRecords.length).to.be.above(0);

        for (let i=0; i<toRevokeRecords.length; i++) {
            let record = toRevokeRecords[i];
            console.log(JSON.stringify(record, null, 4));

            let input = {};

            input.hashX   = ccUtil.hexTrip0x(record.hashX);
            input.feeHard = param.general.feeHard;
            input.from    = record.from;

            let srcChain = ccUtil.getSrcChainNameByContractAddr('0x0000000000000000000000000000000000000000','BTC');
            let dstChain = ccUtil.getSrcChainNameByContractAddr('WAN','WAN');

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REVOKE', input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;

        }
    });
    it.skip('Revoke: WBTC->BTC', async () => {
        let toRevokeRecords = util.getWbtcTxForRevoke();
        //expect(toRevokeRecords.length).to.be.above(0);

        for (let i=0; i<toRevokeRecords.length; i++) {
            let record = toRevokeRecords[i];
            console.log(JSON.stringify(record, null, 4));

            let input = {};

            input.hashX    = ccUtil.hexTrip0x(record.hashX);
            input.gas      = param.general.wan.gasLimit;
            input.gasPrice = param.general.wan.gasPrice;

            let srcChain = ccUtil.getSrcChainNameByContractAddr('WAN','WAN');
            let dstChain = ccUtil.getSrcChainNameByContractAddr('0x0000000000000000000000000000000000000000','BTC');

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REVOKE', input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
        }
    });
    it('Revoke: ETH->WETH', async () => {
        let toRevokeRecords = util.getEthTxForRevoke();
        //expect(toRevokeRecords.length).to.be.above(0);

        for (let i=0; i<toRevokeRecords.length; i++) {
            let record = toRevokeRecords[i];
            console.log(JSON.stringify(record, null, 4));

            let input = {};

            input.hashX    = record.hashX;
            input.gasLimit = param.general.eth.gasLimit;
            input.gasPrice = param.general.eth.gasPrice;
            input.tokenPairID = record.tokenPairID;

            let srcChain = ccUtil.getSrcChainNameByContractAddr(record.srcChainAddr, record.srcChainType, record.tokenPairID);
            let dstChain = ccUtil.getSrcChainNameByContractAddr(record.dstChainAddr, record.dstChainType, record.tokenPairID);

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REVOKE', input);
            console.log(JSON.stringify(ret, null, 4));
            console.log(ret.result);
            expect(ret.code).to.be.ok;
        }
    });
    it('Revoke: WETH->ETH', async () => {
        let toRevokeRecords = util.getWethTxForRevoke();

        for (let i=0; i<toRevokeRecords.length; i++) {
            let record = toRevokeRecords[i];
            console.log(JSON.stringify(record, null, 4));

            let input = {};

            input.hashX    = record.hashX;
            input.gasLimit = param.general.eth.gasLimit;
            input.gasPrice = param.general.eth.gasPrice;
            input.tokenPairID = record.tokenPairID;

            let srcChain = ccUtil.getSrcChainNameByContractAddr(record.srcChainAddr, record.srcChainType, record.tokenPairID);
            let dstChain = ccUtil.getSrcChainNameByContractAddr(record.dstChainAddr, record.dstChainType, record.tokenPairID);

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REVOKE', input);
            console.log(JSON.stringify(ret, null, 4));
            console.log(ret.result);
            expect(ret.code).to.be.ok;
        }
    });
    it('Revoke: ERC20->WERC20', async () => {
        let toRevokeRecords = util.getErc20TxForRevoke();

        for (let i=0; i<toRevokeRecords.length; i++) {
            let record = toRevokeRecords[i];
            console.log(JSON.stringify(record, null, 4));

            let input = {};

            input.hashX    = record.hashX;
            input.gasLimit = param.general.eth.gasLimit;
            input.gasPrice = param.general.eth.gasPrice;
            input.tokenPairID = record.tokenPairID;

            let srcChain = ccUtil.getSrcChainNameByContractAddr(record.srcChainAddr, record.srcChainType, record.tokenPairID);
            let dstChain = ccUtil.getSrcChainNameByContractAddr(record.dstChainAddr, record.dstChainType, record.tokenPairID);

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REVOKE', input);
            console.log(JSON.stringify(ret, null, 4));
            console.log(ret.result);
            expect(ret.code).to.be.ok;
        }
    });
    it('Revoke: WERC20->ERC20', async () => {
        let toRevokeRecords = util.getWErc20TxForRevoke();

        for (let i=0; i<toRevokeRecords.length; i++) {
            let record = toRevokeRecords[i];
            console.log(JSON.stringify(record, null, 4));

            let input = {};

            input.hashX    = record.hashX;
            input.gasLimit = param.general.wan.gasLimit;
            input.gasPrice = param.general.wan.gasPrice;
            input.tokenPairID = record.tokenPairID;

            let srcChain = ccUtil.getSrcChainNameByContractAddr(record.srcChainAddr, record.srcChainType, record.tokenPairID);
            let dstChain = ccUtil.getSrcChainNameByContractAddr(record.dstChainAddr, record.dstChainType, record.tokenPairID);

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REVOKE', input);
            console.log(JSON.stringify(ret, null, 4));
            console.log(ret.result);
            expect(ret.code).to.be.ok;
        }
    });
    // it('Revoke: WAN->WAN@eth', async () => {
    //     let toRevokeRecords = util.getEthTxForRevoke();
    //     //expect(toRevokeRecords.length).to.be.above(0);

    //     for (let i=0; i<toRevokeRecords.length; i++) {
    //         let record = toRevokeRecords[i];
    //         console.log(JSON.stringify(record, null, 4));

    //         let input = {};

    //         input.hashX    = record.hashX;
    //         input.gasLimit = param.general.eth.gasLimit;
    //         input.gasPrice = param.general.eth.gasPrice;
    //         input.tokenPairID = record.tokenPairID;

    //         let srcChain = ccUtil.getSrcChainNameByContractAddr(record.srcChainAddr, record.srcChainType, record.tokenPairID);
    //         let dstChain = ccUtil.getSrcChainNameByContractAddr(record.dstChainAddr, record.dstChainType, record.tokenPairID);

    //         let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REVOKE', input);
    //         console.log(JSON.stringify(ret, null, 4));
    //         console.log(ret.result);
    //         expect(ret.code).to.be.ok;
    //     }
    // });
    // it.skip('Revoke: WAN@eth->WAN', async () => {
    //     let toRevokeRecords = util.getWethTxForRevoke();

    //     for (let i=0; i<toRevokeRecords.length; i++) {
    //         let record = toRevokeRecords[i];
    //         console.log(JSON.stringify(record, null, 4));

    //         let input = {};

    //         input.hashX    = record.hashX;
    //         input.gasLimit = param.general.eth.gasLimit;
    //         input.gasPrice = param.general.eth.gasPrice;
    //         input.tokenPairID = record.tokenPairID;

    //         let srcChain = ccUtil.getSrcChainNameByContractAddr(record.srcChainAddr, record.srcChainType, record.tokenPairID);
    //         let dstChain = ccUtil.getSrcChainNameByContractAddr(record.dstChainAddr, record.dstChainType, record.tokenPairID);

    //         let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REVOKE', input);
    //         console.log(JSON.stringify(ret, null, 4));
    //         console.log(ret.result);
    //         expect(ret.code).to.be.ok;
    //     }
    // });
    it.skip('Revoke: EOS->WEOS', async () => {
        let toRevokeRecords = util.getEosTxForRevoke();

        for (let i=0; i<toRevokeRecords.length; i++) {
            let record = toRevokeRecords[i];
            console.log(JSON.stringify(record, null, 4));

            let input = {};

            input.hashX    = record.hashX;

            let srcChain = ccUtil.getSrcChainNameByContractAddr(record.srcChainAddr,'EOS');
            let dstChain = ccUtil.getSrcChainNameByContractAddr('WAN','WAN');

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REVOKE', input);
            console.log(JSON.stringify(ret, null, 4));
            console.log(ret.result);
            expect(ret.code).to.be.ok;
        }
    });
    it.skip('Revoke: WEOS->EOS', async () => {
        let toRevokeRecords = util.getWEosTxForRevoke();

        for (let i=0; i<toRevokeRecords.length; i++) {
            let record = toRevokeRecords[i];
            console.log(JSON.stringify(record, null, 4));

            let input = {};

            input.hashX    = record.hashX;
            input.gasLimit = param.general.wan.gasLimit;
            input.gasPrice = param.general.wan.gasPrice;

            let srcChain = ccUtil.getSrcChainNameByContractAddr('WAN','WAN');
            let dstChain = ccUtil.getSrcChainNameByContractAddr(record.dstChainAddr,'EOS');

            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REVOKE', input);
            console.log(JSON.stringify(ret, null, 4));
            console.log(ret.result);
            expect(ret.code).to.be.ok;
        }
    });
});

