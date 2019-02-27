/**
 * creatBTCAddress
 */

let param  = require('./input.json');
let config = require('./config.json');
let setup  = require('./setup');
let util   = require('./util');
let btcUtil= require("../../src/api/btcUtil");
let ccUtil = require("../../src/api/ccUtil");

async function testRedeem() {
    // Get redeem records from DB
    let toRedeemRecords = util.getWbtcTxForRedeem();
    if (!toRedeemRecords || toRedeemRecords.length<1) {
        console.log("No TX found for redeem!!!");
        return Promise.resolve("OK"); 
    }

    let record = toRedeemRecords[0];
    console.log("Redeem WBTC transaction: ", JSON.stringify(record, null, 4));

    let input = {};

    input.hashX   = ccUtil.hexTrip0x(record.HashX); 
    input.feeHard = param.feeHard;

    let aliceAddr = btcUtil.hash160ToAddress(record.crossAddress,'pubkeyhash', 'testnet');
    let alice = await btcUtil.getECPairsbyAddr(param.password, aliceAddr);

    input.keypair = alice;

    console.log("Redeem input: ", JSON.stringify(input, null, 4));

    let dstChain = ccUtil.getSrcChainNameByContractAddr('BTC','BTC');
    let srcChain = ccUtil.getSrcChainNameByContractAddr('WAN','WAN');

    ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', input);
    console.log(ret.result);

    return 0;
}

async function main() {
    await setup.init();

    await testRedeem();    

    setup.shutdown();

    console.log("Bye");
}

main();
