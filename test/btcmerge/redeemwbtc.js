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
let amount=1000000; // in sto 
let feeRate=300;
let feeHard=100000;
let password='welcome1';
let changeAddr='mgrCYKXkmgWLqZkLv6dhdkLHY2f1Y4qK1t';
let gasPrice = 200000000000;
let gasLimit = 1000000;

let storemanWanAddr = '0x9ebf2acd509e0d5f9653e755f26d9a3ddce3977c';
let storemanBtcAddr = '0x83e5ca256c9ffd0ae019f98e4371e67ef5026d2d';

let crossAddr = "0x0e9bebc653c579886cde1eacd7f4a5d43ef9aa15"
let x = "4c972c9aaee314ec31b3930f2e33b20ccb3fe1575c61018e660e65b99a962a6c";
let hashX = "fa3dce71da5b191e85611874deed7f529abd4af5dcf39a354358a67f27bc6935";

async function testRedeem() {
    let input = {};

    input.hashX   = hashX; // use hashX to get record
    input.feeHard = feeHard;

    let rec;
    let records = await ccUtil.getBtcWanTxHistory();
    for (let i=0; i<records.length; i++) {
        if (records[i].HashX == hashX) {
            rec = records[i]; 
            break;
        }
    }

    console.log("Record:", JSON.stringify(rec, null, 4));
    let aliceAddr = btcUtil.hash160ToAddress(rec.crossAddress,'pubkeyhash', 'testnet');
    let alice = await btcUtil.getECPairsbyAddr(password, aliceAddr);
    console.log("Alice:", alice);

    input.keypair = alice;

    let dstChain = ccUtil.getSrcChainNameByContractAddr('BTC','BTC');
    let srcChain = ccUtil.getSrcChainNameByContractAddr('WAN','WAN');
    console.log("Source chain: ", JSON.stringify(srcChain, null, 4));
    console.log("Destination chain: ", JSON.stringify(dstChain, null, 4));

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
