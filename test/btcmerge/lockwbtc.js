/**
 * creatBTCAddress
 */

let param  = require('./input.json');
let config = require('./config.json');
let setup  = require('./setup');
let util   = require('./util');
let btcUtil= require("../../src/api/btcUtil");
let ccUtil = require("../../src/api/ccUtil");

async function testLock() {
    //
    let input = {};
    input.from     = param.wanAddr;
    input.gas      = param.gasLimit;
    input.gasPrice = param.gasPrice;
    input.amount   = Number(param.amount);
    input.value    = ccUtil.calculateLocWanFeeWei(param.amount, global.btc2WanRatio, param.txFeeRatio);;
    input.storeman = param.storemanWanAddr;
    input.crossAddr = '0x' + btcUtil.addressToHash160(param.changeAddr, 'pubkeyhash', config.network);
    input.password  = param.password;
    // Generate secret key 
    input.x        = ccUtil.generatePrivateKey().slice(2);

    console.log("Input:", JSON.stringify(input, null, 4));

    let srcChain = ccUtil.getSrcChainNameByContractAddr('WAN','WAN');
    let dstChain = ccUtil.getSrcChainNameByContractAddr('BTC','BTC');

    ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', input);
    console.log(ret.result);
}

async function main() {
    await setup.init();

    await testLock();    

    setup.shutdown();

    console.log("Bye");
}

main();
