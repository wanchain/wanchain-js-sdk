/**
 * Test naming service
 *
 * Copyright (c) 2019, Wanchain.
 * Liscensed under MIT license.
 */

const expect = require('chai').expect;

let param  = require('./input.json');
let setup  = require('../setup');
let wUtil = require("../../../src/util/util");
let w3Util = require("../../../src/util/web3util");
let hdUtil = require("../../../src/api/hdUtil");
let util  = require("./util");

let WNS  = require("../../../src/wns/wns");

/**
 * WNS test
 */
describe('WNS test', () => {
    let password = param.hd.password;
    let mnemonic = param.hd.mnemonic.revealed;
    let casewns = "WNS";

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
    it.skip('Get sc functions', async () => {
        //
        wns = wUtil.getConfigSetting('sdk:config:contract:wns');

        for (func in wns) {
            console.log(">>WNS function: ", func);

            for (var i in wns[func].abi) {
                var fun = wns[func].abi[i];
                if (fun.type == 'function') {
                    var sig = w3Util.signFunction(fun);
                    console.log("    Func: ", fun.name, " signature:", sig);
                }
            }
        }

    });
    it('Get name address', async () => {
        //
        let wns = new WNS();
        let t = param.tests[casewns];
        let action='getaddr'
        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.action != action) {
                continue
            }
            let addr = await wns.getAddr(tc.name);
            console.log("Name [%s], address [%s]", tc.name, addr);
            expect(addr).to.equal(tc.expected);

        }

        //let e = await wns.getTestExpiryTime('ktfc76');
        //console.log("Name expires at: ", e);

    });
    it('Get auction status and new auction', async () => {
        //
        let wns = new WNS();

        let action='auction'
        let chain = 'WAN';
        let amount = 0;

        let now = Date.now();

        let t = param.tests[casewns];
        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.action != action || tc.skip) {
                continue
            }

            console.log("Auction for name '%s'", tc.name)
            let e = await wns.auctionEntries(tc.name);
            console.log("Auction status: ", e);
            if (e.status.code != 0) {
                console.log("auction not allowed!");
                continue;
            }

            //let t = await wns.getAuctionAllowedTime(name);
            //console.log("Auction allowed time: ", t);
            //if (t.getTime() < now) {

            //}

            let addr = await hdUtil.getAddress(tc.wid, chain, tc.path);
            let tx = {
                "from" : '0x' + addr.address,
                "value" : amount,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                "BIP44Path" : tc.path,
                "walletID" : tc.wid
            };

            let txh = await wns.startAuction(tc.name, tx);
            console.log("auction txhash=", txh);
        }

    });
    it.skip('Auction new bid', async () => {
        //
        let wns = new WNS();

        let action='newBid'
        let chain = 'WAN';

        let t = param.tests[casewns];
        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.action != action || tc.skip) {
                continue
            }

            let addr = await hdUtil.getAddress(tc.wid, chain, tc.path);
            let owner = '0x' + addr.address;

            let bid = await wns.shaBid(tc.name, owner, tc.value, tc.secret);
            console.log("Auction bid: ", bid);

            let tx = {
                "from" : '0x' + addr.address,
                "value" : tc.amount,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                "BIP44Path" : tc.path,
                "walletID" : tc.wid
            }
            let txh = await wns.newBid(bid, tx);
            console.log("bid txhash=", txh);
        }
    });
    it('unseal bid', async () => {
        //
        let wns = new WNS();

        let action='unsealBid'
        let chain = 'WAN';
        let amount = 0;

        let t = param.tests[casewns];
        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.action != action || tc.skip) {
                continue
            }

            let addr = await hdUtil.getAddress(tc.wid, chain, tc.path);
            let owner = '0x' + addr.address;

            let tx = {
                "from" : '0x' + addr.address,
                "value" : amount,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                "BIP44Path" : tc.path,
                "walletID" : tc.wid
            }
            let txh = await wns.unsealBid(tc.name, tc.value, tc.secret, tx);
            console.log("bid txhash=", txh);
        }
    });
    it.skip('finalize auction', async () => {
        //
        let wns = new WNS();

        let action='finalizeAuction'
        let chain = 'WAN';
        let amount = 0;

        let t = param.tests[casewns];
        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.action != action || tc.skip) {
                continue
            }

            let addr = await hdUtil.getAddress(tc.wid, chain, tc.path);
            let owner = '0x' + addr.address;

            let tx = {
                "from" : '0x' + addr.address,
                "value" : amount,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                "BIP44Path" : tc.path,
                "walletID" : tc.wid
            }
            let txh = await wns.finalizeAuction(tc.name, tx);
            console.log("finalize txhash=", txh);
        }
    });
    it.skip('release deed', async () => {
        //
        let wns = new WNS();

        let action='releaseDeed'
        let chain = 'WAN';
        let amount = 0;

        let t = param.tests[casewns];
        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.action != action || tc.skip) {
                continue
            }

            let addr = await hdUtil.getAddress(tc.wid, chain, tc.path);
            let owner = '0x' + addr.address;

            let tx = {
                "from" : '0x' + addr.address,
                "value" : amount,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                "BIP44Path" : tc.path,
                "walletID" : tc.wid
            }
            let txh = await wns.releaseDeed(tc.name, tx);
            console.log("release deed txhash=", txh);
        }
    });
    it.skip('transfer deed', async () => {
        //
        let wns = new WNS();

        let action='transferDeed'
        let chain = 'WAN';
        let amount = 0;

        let t = param.tests[casewns];
        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.action != action || tc.skip) {
                continue
            }

            let addr = await hdUtil.getAddress(tc.wid, chain, tc.path);
            let owner = '0x' + addr.address;

            let tx = {
                "from" : '0x' + addr.address,
                "value" : amount,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                "BIP44Path" : tc.path,
                "walletID" : tc.wid
            }
            let txh = await wns.transferDeed(tc.name, tc.newowner, tx);
            console.log("transfer deed txhash=", txh);
        }
    });
    it.skip('check winner', async () => {
        //
        let wns = new WNS();

        let action='bidwinner'
        let chain = 'WAN';
        let amount = 0;

        let t = param.tests[casewns];
        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.action != action || tc.skip) {
                continue
            }


            let winner = await wns.getBidWinner(tc.name);
            console.log("winner for name [%s] : %s", tc.name, winner);
        }
    });
    it.skip('cancel a bid', async () => {
        //
        let wns = new WNS();
        let name = 'ktfc76';

        let tc = {
            'wid' : 1,
            'path' : "m/44'/5718350'/0'/0/1",
            'amount' : 2
        }
        let chain = 'WAN';
        let secret= param.hd.password;
        let addr = await hdUtil.getAddress(tc.wid, chain, tc.path);
        let owner = '0x' + addr.address;

        let bid = await wns.shaBid(name, owner, tc.amount, secret);
        console.log("Auction bid: ", bid);

        tc.amount = 0;

        let tx = {
            "from" : '0x' + addr.address,
            "value" : tc.amount,
            "gasPrice" : param.general.wan.gasPrice,
            "gasLimit" : param.general.wan.gasLimit,
            "BIP44Path" : tc.path,
            "walletID" : tc.wid
        }
        let txh = await wns.cancelBid(owner, bid, tx);
        console.log("bid txhash=", txh);
    });
    it('Register test name', async () => {
        //
        let wns = new WNS();

        let t = param.tests[casewns];
        let action='testregister'
        let chain = 'WAN';
        let amount = 0;

        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.action != action || tc.skip) {
                continue
            }

            let addr = await hdUtil.getAddress(tc.wid, chain, tc.path);
            let owner = '0x' + addr.address;
            let tx = {
                "from" : '0x' + addr.address,
                "value" : amount,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                "BIP44Path" : tc.path,
                "walletID" : tc.wid
            }
            let txhash = await wns.registerTest(tc.name, owner, tx);
            console.log(txhash);
        }

    });
    it('Set test resolver', async () => {
        //
        let wns = new WNS();

        let action='testregister'
        let chain = 'WAN';
        let amount = 0;

        let t = param.tests[casewns];
        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.action != action || tc.skip) {
                continue
            }

            let addr = await hdUtil.getAddress(tc.wid, chain, tc.path);
            let tx = {
                "from" : '0x' + addr.address,
                "value" : amount,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                "BIP44Path" : tc.path,
                "walletID" : tc.wid
            };

            let resolver = tc.resolver;
            if (!resolver) {
                resolver = wns.getPublicResolver().addr;
            }
            let txhash = await wns.setResolver(tc.name, resolver, tx);
            console.log(txhash);
        }

    });
    it('Set test address', async () => {
        //
        let wns = new WNS();

        let action='setaddr'
        let chain = 'WAN';
        let amount = 0;

        let t = param.tests[casewns];
        for (let i=0; i<t.case.length; i++) {
            let tc = t.case[i];

            if (tc.action != action || tc.skip) {
                continue
            }

            let addr = await hdUtil.getAddress(tc.wid, chain, tc.path);
            let owner = '0x' + addr.address;
            let tx = {
                "from" : '0x' + addr.address,
                "value" : amount,
                "gasPrice" : param.general.wan.gasPrice,
                "gasLimit" : param.general.wan.gasLimit,
                "BIP44Path" : tc.path,
                "walletID" : tc.wid
            };

            let resolver = tc.resolver;
            if (!resolver) {
                resolver = wns.getPublicResolver().addr;
            }
            let txhash = await wns.setAddr(tc.name, resolver, tx);
            console.log(txhash);
        }
    });
});

