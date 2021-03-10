/**
 * Test transfer
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
 * Transaction test
 */
describe('HD wallet transaction test', () => {
    let password = param.hd.password;
    let mnemonic = param.hd.mnemonic.revealed;
    let casewan = "TX-WAN";
    let caseeth = "TX-ETH";
    let casebtc = "TX-BTC";
    let caseeos = "TX-EOS";
    let casexrp = "TX-XRP";
    let casetoken = "TX-wanToken";

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
        await util.checkRun();

        setup.shutdown();
    });
    it.skip('Transfer WAN', async () => {
        let t = param.tests[casewan];
        let chain = t.chain || 'WAN';

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            asset = tc.asset || 'WAN';

            console.log(`Runing: '${tc.desc}', asset - '${chain}:${asset}'`);

            // 1. Get from address from wallet
            let addr = await hdUtil.getAddress(tc.wid, chain, tc.path);
            console.log(`Address for '${tc.path}': '0x${addr.address}'`);

            let input = {
                "symbol" : asset,
                "from" : '0x' + addr.address,
                "to" : tc.to,
                "amount" : tc.amount,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                "BIP44Path" : tc.path,
                "walletID" : tc.wid
            }

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr('0x0000000000000000000000000000000000000000', chain);
            console.log("Source chain: ", JSON.stringify(srcChain, null, 4));
            let ret = await global.crossInvoker.invokeNormalTrans(srcChain, input, false);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;

            util.checkNormalTxStatus(ret.result, 'Success');

        }
    });
    it('Transfer ETH', async () => {
        let t = param.tests[caseeth];
        let chain = t.chain || 'ETH';

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            asset = tc.asset || 'ETH';

            console.log(`Runing: '${tc.desc}', asset - '${chain}:${asset}'`);

            // 1. Get from address from wallet
            let addr = await hdUtil.getAddress(tc.wid, chain, tc.path);
            console.log(`Address for '${tc.path}': '0x${addr.address}'`);

            let input = {
                "symbol" : asset,
                "from" : '0x' + addr.address,
                "to" : tc.to,
                "amount" : tc.amount,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                "BIP44Path" : tc.path,
                "walletID" : tc.wid
            }

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr('0x0000000000000000000000000000000000000000', chain);
            console.log("Source chain: ", JSON.stringify(srcChain, null, 4));
            let ret = await global.crossInvoker.invokeNormalTrans(srcChain, input, true);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;

            util.checkNormalTxStatus(ret.result, 'Success');

        }
    });
    it.skip('Transfer BTC', async () => {
        let t = param.tests[casebtc];
        let chain = t.chain || 'BTC';

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            console.log(`Runing: '${tc.desc}'`);

            let input = {
                "from" : tc.from,
                // "to" : tc.to,
                "to" : "mrnWPfdAhY7Sb6buVZnd3JcPSFNupKNpwN",
                "changeAddress" : t.changeAddr,
                "value" : tc.value, // Unit BTC?
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                "feeRate" : param.general.feeRate,
                // "sendAll" : true,
                "op_return" : "01000f9771c5c8df60872eb2a527a10ae4b516377ffcee000078ba"
                // "op_return" : "01mzBASiY7Xu94UZXQExnhC6s2MinUkegMFu"
            }

            // let op_return_cross_type = '01';
            // let tokenPairId = 1;
            // let address = "0x620b168ad1cbae2bf69f117aaec7a0390917b473";
            // let hex_tokenPairID = tokenPairId.toString(16);
            // if (hex_tokenPairID.length === 1) {
            //     hex_tokenPairID = '0' + hex_tokenPairID;
            // }
            // let ccUtil = require("../../../src/api/ccUtil");
            // input.op_return = op_return_cross_type + hex_tokenPairID + ccUtil.hexTrip0x(address);
            // input.op_return = '09' + Buffer.from('mzBASiY7Xu94UZXQExnhC6s2MinUkegMFu').toString('hex');

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr('0x0000000000000000000000000000000000000000', chain);
            console.log("Source chain: ", JSON.stringify(srcChain, null, 4));
            let ret = await global.crossInvoker.invokeNormalTrans(srcChain, input, true);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
        }
    });
    it.skip('Transfer Token', async () => {
        let t = param.tests[casetoken];
        let chain = t.chain || 'WAN';

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            asset = tc.asset;

            console.log(`Runing: '${tc.desc}', asset - '${chain}:${asset}'`);

            // 1. Get from address from wallet
            let addr = await hdUtil.getAddress(tc.wid, chain, tc.path);
            console.log(`Address for '${tc.path}': '0x${addr.address}'`);

            let input = {
                "from" : '0x' + addr.address,
                "to" : tc.to,
                "amount" : tc.amount,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                "BIP44Path" : tc.path,
                "walletID" : tc.wid
            }

            let srcChain = await global.crossInvoker.getChainInfoByContractAddr(asset, chain);
            console.log("Source chain: ", JSON.stringify(srcChain, null, 4));
            let ret = await global.crossInvoker.invokeNormalTrans(srcChain, input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;

            util.checkNormalTxStatus(ret.result, 'Success');

        }
    });
    it.skip('Transfer EOS', async () => {
        let t = param.tests[caseeos];
        let chain = t.chain || 'EOS';

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            console.log(`Runing: '${tc.desc}'`);

            let input = {
                "from" : tc.from,
                "to" : tc.to,
                "amount" : tc.value,
                "BIP44Path" : tc.path,
                "walletID" : tc.wid
            }

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(tc.tokenScAddr, chain);
            console.log("Source chain: ", JSON.stringify(srcChain, null, 4));
            let ret = await global.crossInvoker.invokeNormalTrans(srcChain, input, true);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
        }
    });
    it.skip('Transfer XRP', async () => {
      let t = param.tests[casexrp];
      let chain = t.chain || 'XRP';

      for (let i=0; i<t.case.length; i++) {
          let tc = t.case[i];

          let input = {
              "from" : tc.from,
              "to" : tc.to,
              "BIP44Path" : tc.path,
              "value" : tc.value, // Unit BTC?
          }

          let srcChain = global.crossInvoker.getSrcChainNameByContractAddr('0x0000000000000000000000000000000000000000', chain);
          let ret = await global.crossInvoker.invokeNormalTrans(srcChain, input);
          console.log(JSON.stringify(ret, null, 4));
          expect(ret.code).to.be.ok;
      }
    })
});

