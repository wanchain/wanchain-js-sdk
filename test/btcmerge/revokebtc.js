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
let feeHard=5000;
let password='welcome1';
let changeAddr='mgrCYKXkmgWLqZkLv6dhdkLHY2f1Y4qK1t';
let gasPrice = 200000000000;
let gasLimit = 1000000;

let storemanWanAddr = '0x9ebf2acd509e0d5f9653e755f26d9a3ddce3977c';
let storemanBtcAddr = '0x83e5ca256c9ffd0ae019f98e4371e67ef5026d2d';

let x = "b5d672db5de650fdd313e333b878927319ab1c0a57293a0e0faa7f1cf15661ee";
let hashX = "9929f89b78010f12448e567f833655f1e56b1f1f04849b61c11ec7f464befed2";

async function testRevoke() {
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

    console.log("Alice:", JSON.stringify(rec, null, 4));
    let alice = await btcUtil.getECPairsbyAddr(password, rec.from);
    console.log("Alice:", alice);

    input.keypair = alice;

    let srcChain = ccUtil.getSrcChainNameByContractAddr('BTC','BTC');
    let dstChain = ccUtil.getSrcChainNameByContractAddr('WAN','WAN');
    console.log("Source chain: ", JSON.stringify(srcChain, null, 4));
    console.log("Destination chain: ", JSON.stringify(dstChain, null, 4));

    ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REVOKE', input);
    console.log(ret.result);

    return 0;
}

async function main() {
    await setup.init();

    await testRevoke();    

    console.log("Bye");
}

main();
