/**
 * creatBTCAddress
 */

let param  = require('./input.json');
let config = require('./config.json');
let setup  = require('./setup');
let util   = require('./util');
let btcUtil= require("../../src/api/btcUtil");
let ccUtil = require("../../src/api/ccUtil");

async function testRevoke() {
    // Get redeem records from DB
    let toRevokeRecords = util.getWbtcTxForRevoke();
    if (!toRevokeRecords || toRevokeRecords.length<1) {
        console.log("No TX found for revoke!!!");
        return Promise.resolve("OK"); 
    }

    let record = toRevokeRecords[0];
    console.log("Revoke WBTC transaction: ", JSON.stringify(record, null, 4));

    let input = {};

    input.hashX    = ccUtil.hexTrip0x(record.HashX); // use hashX to get record

    input.gas      = param.gasLimit;
    input.gasPrice = param.gasPrice;

    input.password = param.password;

    console.log("Revoke input: ", JSON.stringify(input, null, 4));

    let dstChain = ccUtil.getSrcChainNameByContractAddr('BTC','BTC');
    let srcChain = ccUtil.getSrcChainNameByContractAddr('WAN','WAN');

    ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REVOKE', input);
    console.log(ret.result);

    return 0;
}

async function main() {
    await setup.init();

    await testRevoke();    

    setup.shutdown();

    console.log("Bye");
}

main();
