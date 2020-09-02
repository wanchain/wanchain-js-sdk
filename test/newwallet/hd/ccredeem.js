/**
 * Test cross-chain redeem
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
        // setup.shutdown();
    });
    it.skip('BTC->WBTC', async () => {
        let toRedeemRecords = util.getBtcTxForRedeem();
        //expect(toRedeemRecords.length).to.be.above(0);

        for (let i=0; i<toRedeemRecords.length; i++) {
            let record = toRedeemRecords[i];
            console.log(JSON.stringify(record, null, 4));

            let input = {};
            input.x        = ccUtil.hexAdd0x(record.x);
            input.hashX    = ccUtil.hexTrip0x(record.hashX); // use hashX to get record
            input.gas      = param.general.wan.gasLimit;
            input.gasPrice = param.general.wan.gasPrice;

            let srcChain = ccUtil.getSrcChainNameByContractAddr('0x0000000000000000000000000000000000000000','BTC');
            let dstChain = ccUtil.getSrcChainNameByContractAddr('WAN','WAN');

            ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
        }
    });
    it.skip('WBTC->BTC', async () => {
        let toRedeemRecords = util.getWbtcTxForRedeem();
        //expect(toRedeemRecords.length).to.be.above(0);

        for (let i=0; i<toRedeemRecords.length; i++) {
            let record = toRedeemRecords[i];
            console.log(JSON.stringify(record, null, 4));

            let input = {};
            input.x       = ccUtil.hexAdd0x(record.x);
            input.hashX   = ccUtil.hexTrip0x(record.hashX); // use hashX to get record
            input.feeHard = param.general.feeHard;

            let srcChain = ccUtil.getSrcChainNameByContractAddr('WAN','WAN');
            let dstChain = ccUtil.getSrcChainNameByContractAddr('0x0000000000000000000000000000000000000000','BTC');

            ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
        }
    });
    it('ETH->WETH', async () => {
        let toRedeemRecords = util.getEthTxForRedeem();
        //expect(toRedeemRecords.length).to.be.above(0);

        for (let i=0; i<toRedeemRecords.length; i++) {
            let record = toRedeemRecords[i];
            console.log(JSON.stringify(record, null, 4));

            let input = {};
            input.x       = ccUtil.hexAdd0x(record.x);
            input.hashX   = record.hashX; // use hashX to get record
            input.gasPrice= param.general.wan.gasPrice;
            input.gasLimit= param.general.wan.gasLimit;
            input.tokenPairID = record.tokenPairID;

            let srcChain = ccUtil.getSrcChainNameByContractAddr(record.srcChainAddr, record.srcChainType, record.tokenPairID);
            let dstChain = ccUtil.getSrcChainNameByContractAddr(record.dstChainAddr, record.dstChainType, record.tokenPairID);

            ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
        }
    });
    it('WETH->ETH', async () => {
        let toRedeemRecords = util.getWethTxForRedeem();
        //expect(toRedeemRecords.length).to.be.above(0);

        for (let i=0; i<toRedeemRecords.length; i++) {
            let record = toRedeemRecords[i];
            console.log(JSON.stringify(record, null, 4));

            let input = {};
            input.x       = ccUtil.hexAdd0x(record.x);
            input.hashX   = record.hashX; // use hashX to get record
            input.gasPrice= param.general.eth.gasPrice;
            input.gasLimit= param.general.eth.gasLimit;
            input.tokenPairID = record.tokenPairID;

            let srcChain = ccUtil.getSrcChainNameByContractAddr(record.srcChainAddr, record.srcChainType, record.tokenPairID);
            let dstChain = ccUtil.getSrcChainNameByContractAddr(record.dstChainAddr, record.dstChainType, record.tokenPairID);

            ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
        }
    });
    it('ERC20->WRC20', async () => {
        let toRedeemRecords = util.getErc20TxForRedeem();
        //expect(toRedeemRecords.length).to.be.above(0);

        for (let i=0; i<toRedeemRecords.length; i++) {
            let record = toRedeemRecords[i];
            console.log(JSON.stringify(record, null, 4));

            let input = {};
            input.x       = ccUtil.hexAdd0x(record.x);
            input.hashX   = record.hashX; // use hashX to get record
            input.gasPrice= param.general.wan.gasPrice;
            input.gasLimit= param.general.wan.gasLimit;
            input.tokenPairID = record.tokenPairID;

            let srcChain = ccUtil.getSrcChainNameByContractAddr(record.srcChainAddr, record.srcChainType, record.tokenPairID);
            let dstChain = ccUtil.getSrcChainNameByContractAddr(record.dstChainAddr, record.dstChainType, record.tokenPairID);

            ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
        }
    });
    it('WRC20->ERC20', async () => {
        let toRedeemRecords = util.getWErc20TxForRedeem();
        //expect(toRedeemRecords.length).to.be.above(0);

        for (let i=0; i<toRedeemRecords.length; i++) {
            let record = toRedeemRecords[i];
            console.log(JSON.stringify(record, null, 4));

            let input = {};
            input.x       = ccUtil.hexAdd0x(record.x);
            input.hashX   = record.hashX; // use hashX to get record
            input.gasPrice= param.general.eth.gasPrice;
            input.gasLimit= param.general.eth.gasLimit;
            input.tokenPairID = record.tokenPairID;

            let srcChain = ccUtil.getSrcChainNameByContractAddr(record.srcChainAddr, record.srcChainType, record.tokenPairID);
            let dstChain = ccUtil.getSrcChainNameByContractAddr(record.dstChainAddr, record.dstChainType, record.tokenPairID);

            ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
        }
    });
    // it.skip('WAN->WAN@eth', async () => {
    //     let toRedeemRecords = util.getEthTxForRedeem();
    //     //expect(toRedeemRecords.length).to.be.above(0);

    //     for (let i=0; i<toRedeemRecords.length; i++) {
    //         let record = toRedeemRecords[i];
    //         console.log(JSON.stringify(record, null, 4));

    //         let input = {};
    //         input.x       = ccUtil.hexAdd0x(record.x);
    //         input.hashX   = record.hashX; // use hashX to get record
    //         input.gasPrice= param.general.wan.gasPrice;
    //         input.gasLimit= param.general.wan.gasLimit;
    //         input.tokenPairID = record.tokenPairID;

    //         let srcChain = ccUtil.getSrcChainNameByContractAddr(record.srcChainAddr, record.srcChainType, record.tokenPairID);
    //         let dstChain = ccUtil.getSrcChainNameByContractAddr(record.dstChainAddr, record.dstChainType, record.tokenPairID);

    //         ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', input);
    //         console.log(JSON.stringify(ret, null, 4));
    //         expect(ret.code).to.be.ok;
    //     }
    // });
    // it.skip('WAN@eth->WAN', async () => {
    //     let toRedeemRecords = util.getWethTxForRedeem();
    //     //expect(toRedeemRecords.length).to.be.above(0);

    //     for (let i=0; i<toRedeemRecords.length; i++) {
    //         let record = toRedeemRecords[i];
    //         console.log(JSON.stringify(record, null, 4));

    //         let input = {};
    //         input.x       = ccUtil.hexAdd0x(record.x);
    //         input.hashX   = record.hashX; // use hashX to get record
    //         input.gasPrice= param.general.eth.gasPrice;
    //         input.gasLimit= param.general.eth.gasLimit;
    //         input.tokenPairID = record.tokenPairID;

    //         let srcChain = ccUtil.getSrcChainNameByContractAddr(record.srcChainAddr, record.srcChainType, record.tokenPairID);
    //         let dstChain = ccUtil.getSrcChainNameByContractAddr(record.dstChainAddr, record.dstChainType, record.tokenPairID);

    //         ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', input);
    //         console.log(JSON.stringify(ret, null, 4));
    //         expect(ret.code).to.be.ok;
    //     }
    // });
    // it.skip('FNX->wanFNX@eth', async () => {
    //     let toRedeemRecords = util.getErc20TxForRedeem();
    //     //expect(toRedeemRecords.length).to.be.above(0);

    //     for (let i=0; i<toRedeemRecords.length; i++) {
    //         let record = toRedeemRecords[i];
    //         console.log(JSON.stringify(record, null, 4));

    //         let input = {};
    //         input.x       = ccUtil.hexAdd0x(record.x);
    //         input.hashX   = record.hashX; // use hashX to get record
    //         input.gasPrice= param.general.wan.gasPrice;
    //         input.gasLimit= param.general.wan.gasLimit;
    //         input.tokenPairID = record.tokenPairID;

    //         let srcChain = ccUtil.getSrcChainNameByContractAddr(record.srcChainAddr, record.srcChainType, record.tokenPairID);
    //         let dstChain = ccUtil.getSrcChainNameByContractAddr(record.dstChainAddr, record.dstChainType, record.tokenPairID);

    //         ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', input);
    //         console.log(JSON.stringify(ret, null, 4));
    //         expect(ret.code).to.be.ok;
    //     }
    // });
    // it.skip('wanFNX@eth->FNX', async () => {
    //     let toRedeemRecords = util.getWErc20TxForRedeem();
    //     //expect(toRedeemRecords.length).to.be.above(0);

    //     for (let i=0; i<toRedeemRecords.length; i++) {
    //         let record = toRedeemRecords[i];
    //         console.log(JSON.stringify(record, null, 4));

    //         let input = {};
    //         input.x       = ccUtil.hexAdd0x(record.x);
    //         input.hashX   = record.hashX; // use hashX to get record
    //         input.gasPrice= param.general.eth.gasPrice;
    //         input.gasLimit= param.general.eth.gasLimit;
    //         input.tokenPairID = record.tokenPairID;

    //         let srcChain = ccUtil.getSrcChainNameByContractAddr(record.srcChainAddr, record.srcChainType, record.tokenPairID);
    //         let dstChain = ccUtil.getSrcChainNameByContractAddr(record.dstChainAddr, record.dstChainType, record.tokenPairID);

    //         ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', input);
    //         console.log(JSON.stringify(ret, null, 4));
    //         expect(ret.code).to.be.ok;
    //     }
    // });
});

