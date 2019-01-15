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

let x = "0xc80c9e6c6f415b83307694d03ef0eb20a84d52069c73d387eda1adfa4a07c690";
let hashX = "c5a90e08f6cd27103cf57d7cd7c5da1d2e1b3276afc80c4470cc07c305d075c8";

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
