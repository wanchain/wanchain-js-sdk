const expect = require('chai').expect;

let param  = require('./input.json');
let setup  = require('../setup');
let hdUtil = require("../../../src/api/hdUtil");
let ccUtil = require("../../../src/api/ccUtil");
let util  = require("./util");

let xrplocklist = {};
let wxrplocklist = {};
let wxrpredeemlist = {};

let myself={};

let getBtcCCTxByLockTxHash = function(hash) {
    return util.getBtcTxHistory({"lockTxhash":hash});
};
/**
 * Cross transaction test
 */
describe('Cross-chain XRP', () => {
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

    it('Lock XRP->wanXRP', async () => {
        let t = param.tests[lksuit];
        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.source !== 'XRP') {
                continue
            }

            console.log(`Runing: '${tc.desc}'`);

            let srcChain = global.crossInvoker.getSrcChainNameByContractAddr('0x0000000000000000000000000000000000000000', tc.source, tc.tokenPairID);
            let dstChain = global.crossInvoker.getSrcChainNameByContractAddr('0x456a7a43f1bbb1c8bc5dacc8c801d7e495a71bcf', tc.destination, tc.tokenPairID);
            let input = {
                "from" : tc.from,
                "value" : tc.value,
                "smgXrpAddr" : "rfrL9vCSYp6Zg3dsXdCGw31PbkEBa6M8xQ",
                "to": tc.to,
                "storeman": "0x000000000000000000000000000000000000000000746573746e65745f303231",
                "tokenPairID": tc.tokenPairID,
                "crossType": 'FAST',
                "networkFee": "50000000"
            }

            if (tc.hasOwnProperty('password')) {
                input.password = tc.password;
            }
            let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', input);
            console.log(JSON.stringify(ret, null, 4));
            expect(ret.code).to.be.ok;
            util.addTxListByLockHash(ccUtil.hexTrip0x(ret.result), "BuddyLocked", xrplocklist);
        }
    });

    it.skip('Redeem wanXRP->XRP', async () => {
      let t = param.tests[lksuit];
      for (let i=0; i<t.case.length; i++) {
          let tc = t.case[i];

          if (tc.destination !== 'XRP') {
              continue
          }

          console.log(`Runing: '${tc.desc}'`);

          let srcChain = global.crossInvoker.getSrcChainNameByContractAddr('0xf451372043c88e5960be1ca6b1ac5e5181a1800b', tc.source, tc.tokenPairID);
          let dstChain = global.crossInvoker.getSrcChainNameByContractAddr('0x0000000000000000000000000000000000000000', tc.destination, tc.tokenPairID);
          let input = {
              "from" : tc.from,
              "amount" : tc.value,
              "to": tc.to,
              "storeman": "0x000000000000000000000000000000000000000000000000006465765f303130",
              "tokenPairID": tc.tokenPairID,
              "crossType": 'FAST',
              "gasPrice" : 200, //param.general.wan.gasPrice,
              "gasLimit" : '350000', //param.general.wan.gasLimit,
          }

          if (tc.hasOwnProperty('password')) {
              input.password = tc.password;
          }
          let ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', input);
          console.log(JSON.stringify(ret, null, 4));
          expect(ret.code).to.be.ok;
          // util.addTxListByLockHash(ccUtil.hexTrip0x(ret.result), "BuddyLocked", xrplocklist);
      }
    });
});

