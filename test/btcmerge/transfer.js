/**
 * creatBTCAddress
 */

let param  = require('./input.json');
let config = require('./config.json');
let setup  = require('./setup');
let util   = require('./util');
let btcUtil= require("../../src/api/btcUtil");
let ccUtil = require("../../src/api/ccUtil");

let Web3 = require("web3");
let web3 = new Web3();

function keysort(key, sortType) {
    return function (a, b) {
        return sortType ? ~~(a[key] < b[key]) : ~~(a[key] > b[key])
    }
}

async function testTransfer() {
    //
    // 1. construct UTXO for transfer
    let addrList;
    addrList = btcUtil.getAddressList();
    console.log("Total BTC address:  ", addrList.length);

    // call filter in unit of bitcoin
    addrList = await ccUtil.filterBtcAddressByAmount(addrList, 
                    web3.toBigNumber(param.amount).div(100000000));

    console.log("Address after filter: ", JSON.stringify(addrList, null, 2));

    let utxos = await ccUtil.getBtcUtxo(config.MIN_CONFIRM_BLKS, config.MAX_CONFIRM_BLKS, addrList);
    //console.log("UTXOS: ", JSON.stringify(utxos, null, 2));
    let balance = await ccUtil.getUTXOSBalance(utxos);
    console.log("Balance: ", balance);

    //utxos = utxos.sort(keysort('value', true));
    //console.log("After sorting: ", JSON.stringify(utxos, null, 2));
        
    if (balance < param.amount) {
        console.log("Not enough balance")
    } else {
        let input = {};
        input.utxos        = utxos;
        input.to           = param.toAddr;
        input.value        = param.amount; // satoish
        input.feeRate      = param.feeRate;
        input.password     = param.password;
        input.changeAddress= param.changeAddr;

        console.log("Transfer input: ", JSON.stringify(input, null, 4));

        let srcChain = ccUtil.getSrcChainNameByContractAddr('BTC','BTC');
        ret = await global.crossInvoker.invokeNormalTrans(srcChain, input);
        console.log(ret.result);
    }

    return 0;
}

async function main() {
    await setup.init();

    await testTransfer();    

    console.log("Bye");
}

main();
