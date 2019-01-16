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
let wanAddress = "0x385f3d29fa5832a624b1566fa00a905b3557b406"
let to="n1EyyAjgiFN7iQqcTX7kJi4oXLZx4KNPnj";
let amount=1000000; // in satoish 
let feeRate=300;
let password='welcome1';
let changeAddr='mgrCYKXkmgWLqZkLv6dhdkLHY2f1Y4qK1t';
let gasPrice = 200000000000;
let gasLimit = 1000000;

let storemanWanAddr = '0x9ebf2acd509e0d5f9653e755f26d9a3ddce3977c';
let storemanBtcAddr = '0x83e5ca256c9ffd0ae019f98e4371e67ef5026d2d';
let txFeeRatio = 10;
let crossAddr = '0x0e9bebc653c579886cde1eacd7f4a5d43ef9aa15'; // '0x' + btcUtil.addressToHash160( changeAddr, 'pubkeyhash', 'testnet');

async function testLock() {
    let passwd = 'welcome1';
    //
    let input = {};
    input.from     = wanAddress;
    input.gas      = gasLimit;
    input.gasPrice = gasPrice;
    input.amount   = Number(amount);
    input.value    = ccUtil.calculateLocWanFeeWei(amount, global.btc2WanRatio, txFeeRatio);;
    input.storeman = storemanWanAddr;
    input.crossAddr = crossAddr;
    input.password  = passwd;
    // Generate secret key 
    input.x        = ccUtil.generatePrivateKey().slice(2);

    console.log("btc2WanRatio=", global.btc2WanRatio);

    console.log("Input:", JSON.stringify(input, null, 4));

    let srcChain = ccUtil.getSrcChainNameByContractAddr('WAN','WAN');
    let dstChain = ccUtil.getSrcChainNameByContractAddr('BTC','BTC');
    console.log("Source chain: ", JSON.stringify(srcChain, null, 4));
    console.log("Destination chain: ", JSON.stringify(dstChain, null, 4));

    ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', input);
    console.log(ret.result);
    return 0;
}

async function main() {
    await setup.init();

    await testLock();    

    console.log("Bye");
}

main();
