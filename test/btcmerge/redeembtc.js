/**
 * creatBTCAddress
 */

let config = require('./config.json');
let setup  = require('./setup');
let btcUtil= require("../../src/api/btcUtil");
let ccUtil = require("../../src/api/ccUtil");

/**
 * Transfer parameter
 */
let to="n1EyyAjgiFN7iQqcTX7kJi4oXLZx4KNPnj";
let amount=10000; // in sto 
let feeRate=300;
let password='welcome1';
let changeAddr='mgrCYKXkmgWLqZkLv6dhdkLHY2f1Y4qK1t';
let gasPrice = 200000000000;
let gasLimit = 1000000;

let storemanWanAddr = '0x9ebf2acd509e0d5f9653e755f26d9a3ddce3977c';
let storemanBtcAddr = '0x83e5ca256c9ffd0ae019f98e4371e67ef5026d2d';

let x = "ab18c3277252610f3e3a542456b4a7b7d629740f4f55d34ce5786af9ed9b22b9";
let hashX = "b9d2bced218149d55a01fe3f79068e350da22a8a53c9ae3a073030d890994a2d";

async function testRedeem() {
    let passwd = 'welcome1';
    let input = {};

    input.x        = x;
    input.hashX    = hashX; // use hashX to get record

    input.gas      = gasLimit;
    input.gasPrice = gasPrice;

    input.password = passwd;

    let srcChain = [ 'BTC',
        { 'tokenSymbol': 'BTC',
          'tokenStand': 'BTC',
          'tokenType': 'BTC',
          'tokenOrigAddr': 'BTC',
          'buddy': '0xcdc96fea7e2a6ce584df5dc22d9211e53a5b18b2',
          'storemenGroup': [],
          'token2WanRatio': 0,
          'tokenDecimals': 18 }];

    let dstChain = ccUtil.getSrcChainNameByContractAddr('WAN','WAN');
    console.log(JSON.stringify(dstChain, null, 4));

    ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', input);
    console.log(ret.result);

    return 0;
}

async function main() {
    await setup.init();

    await testRedeem();    

    console.log("Bye");
}

main();
