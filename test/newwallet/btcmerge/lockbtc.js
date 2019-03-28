/**
 * creatBTCAddress
 */

let param  = require('./input.json');
let config = require('../config.json');
let setup  = require('../setup');
let util   = require('./util');
let btcUtil= require("../../../src/api/btcUtil");
let ccUtil = require("../../../src/api/ccUtil");
let wanUtil= require("../../../src/util/util");

async function testLock() {

    // 1. construct UTXO for transfer
    let addrList;
    addrList = btcUtil.getAddressList();
    console.log("Total BTC address:  ", addrList.length);
    // returned address list is sorted
    addrList = await ccUtil.filterBtcAddressByAmount(addrList, 
        wanUtil.toBigNumber(param.amount).div(100000000));

    console.log("Address after filter: ", JSON.stringify(addrList, null, 2));

    let utxos = await ccUtil.getBtcUtxo(config.MIN_CONFIRM_BLKS, config.MAX_CONFIRM_BLKS, addrList);
    //console.log("UTXOS: ", JSON.stringify(utxos, null, 2));
    let balance = await ccUtil.getUTXOSBalance(utxos);
    console.log("Balance: ", balance);
        
    if (balance < param.amount) {
        console.log("Not enough balance")
    } else {
        let input = {};
        input.utxos        = utxos;
        input.smgBtcAddr   = param.storemanBtcAddr;
        //input.to           = to;
        input.value        = param.amount;
        input.feeRate      = param.feeRate;
        input.password     = param.password; // password for wan address
        input.changeAddress= param.changeAddr;
        input.keypair      = [];

        input.storeman     = param.storemanWanAddr; 
        input.wanAddress   = param.wanAddr; // from address of wan notice message

        input.gas          = param.gasLimit;
        input.gasPrice     = param.gasPrice;

        console.log("UTXO length: ", input.utxos.length);
        let addrMap = {};
        for (let i = 0; i < input.utxos.length; i++) {
            let utxo = input.utxos[i];
            // must call this in async func
            if (!addrMap.hasOwnProperty(utxo.address)) {
                console.log("Get key pair for: %d:%s ",i, utxo.address);
                let kp = await btcUtil.getECPairsbyAddr(input.password, utxo.address);
                input.keypair.push(kp);
                addrMap[utxo.address] = true;
            }
        }

        console.log("key pair array length", input.keypair.length);
        console.log(JSON.stringify(input.keypair, null, 4));

        let srcChain = ccUtil.getSrcChainNameByContractAddr('BTC','BTC');
        let dstChain = ccUtil.getSrcChainNameByContractAddr('WAN','WAN');

        ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', input);
        console.log(ret.result);
    }

    return 0;
}

async function main() {
    await setup.init();

    await testLock();    

    setup.shutdown();

    console.log("Bye");
}

main();
