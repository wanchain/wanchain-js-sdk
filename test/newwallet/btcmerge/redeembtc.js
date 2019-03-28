/**
 * creatBTCAddress
 */

let param  = require('./input.json');
let config = require('../config.json');
let setup  = require('../setup');
let util   = require('./util');
let btcUtil= require("../../../src/api/btcUtil");
let ccUtil = require("../../../src/api/ccUtil");

async function testRedeem() {
    // Get redeem records from DB
    let toRedeemRecords = util.getBtcTxForRedeem();
    if (!toRedeemRecords || toRedeemRecords.length<1) {
        console.log("No TX found for redeem!!!");
        return Promise.resolve("OK"); 
    }

    let record = toRedeemRecords[0];
    console.log("Redeem BTC transaction: ", JSON.stringify(record, null, 4));

    let input = {};
    input.x        = ccUtil.hexAdd0x(record.x);
    input.hashX    = ccUtil.hexTrip0x(record.HashX); // use hashX to get record

    input.gas      = param.gasLimit;
    input.gasPrice = param.gasPrice;

    input.password = param.password;

    console.log("Redeem input: ", JSON.stringify(input, null, 4));

    let srcChain = ccUtil.getSrcChainNameByContractAddr('BTC','BTC');
    let dstChain = ccUtil.getSrcChainNameByContractAddr('WAN','WAN');

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
