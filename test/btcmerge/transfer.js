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

async function testTransfer() {
    let passwd = 'welcome1';
    //
    // 1. construct UTXO for transfer
    let addrList;
    addrList = btcUtil.getAddressList();
    console.log("Address list 1: ", JSON.stringify(addrList, null, 2));
    addrList = await ccUtil.filterBtcAddressByAmount(addrList, amount);

    console.log("Address list 2: ", JSON.stringify(addrList, null, 2));

    let utxos = await ccUtil.getBtcUtxo(config.MIN_CONFIRM_BLKS, config.MAX_CONFIRM_BLKS, addrList);
    console.log("UTXOS: ", JSON.stringify(utxos, null, 2));
    let balance = await ccUtil.getUTXOSBalance(utxos);
    console.log("Balance: ", balance);
        
    if (balance < amount) {
        console.log("Not enough balance")
    } else {
        let input = {};
        input.utxos        = utxos;
        input.to           = to;
        input.value        = amount;
        input.feeRate      = feeRate;
        input.password     = password;
        input.changeAddress= changeAddr;

        let srcChain = [ 'BTC',
            { 'tokenSymbol': 'BTC',
              'tokenStand': 'BTC',
              'tokenType': 'BTC',
              'tokenOrigAddr': 'BTC',
              'buddy': '0xcdc96fea7e2a6ce584df5dc22d9211e53a5b18b2',
              'storemenGroup': [],
              'token2WanRatio': 0,
              'tokenDecimals': 18 }];

        console.log("transfer to ", input.to);
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
