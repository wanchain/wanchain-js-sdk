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
let amount=10000; // in satoish 
let feeRate=300;
let password='welcome1';
let changeAddr='mgrCYKXkmgWLqZkLv6dhdkLHY2f1Y4qK1t';
let gasPrice = 200000000000;
let gasLimit = 1000000;

let storemanWanAddr = '0x9ebf2acd509e0d5f9653e755f26d9a3ddce3977c';
let storemanBtcAddr = '0x83e5ca256c9ffd0ae019f98e4371e67ef5026d2d';

async function testLock() {
    let passwd = 'welcome1';
    //
    // 1. construct UTXO for transfer
    let addrList;
    addrList = btcUtil.getAddressList();
    console.log("Address list 1: ", JSON.stringify(addrList, null, 2));
    // returned address list is sorted
    addrList = await ccUtil.filterBtcAddressByAmount(addrList, amount);

    console.log("Address list 2: ", JSON.stringify(addrList, null, 2));

    let utxos = await ccUtil.getBtcUtxo(config.MIN_CONFIRM_BLKS, config.MAX_CONFIRM_BLKS, addrList);
    //console.log("UTXOS: ", JSON.stringify(utxos, null, 2));
    let balance = await ccUtil.getUTXOSBalance(utxos);
    console.log("Balance: ", balance);
        
    if (balance < amount) {
        console.log("Not enough balance")
    } else {
        let input = {};
        input.utxos        = utxos;
        input.smgBtcAddr   = storemanBtcAddr;
        //input.to           = to;
        input.value        = amount;
        input.feeRate      = feeRate;
        input.password     = password;
        input.changeAddress= changeAddr;
        input.keypair      = [];

        input.storeman     = storemanWanAddr; 
        input.wanAddress   = '0x385f3d29fa5832a624b1566fa00a905b3557b406'; // from address of wan notice message

        input.gas          = gasLimit;
        input.gasPrice     = gasPrice;

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

        let srcChain = [ 'BTC',
            { 'tokenSymbol': 'BTC',
              'tokenStand': 'BTC',
              'tokenType': 'BTC',
              'tokenOrigAddr': 'BTC',
              'buddy': '0xcdc96fea7e2a6ce584df5dc22d9211e53a5b18b2',
              'storemenGroup': [],
              'token2WanRatio': 0,
              'tokenDecimals': 18 }];

        let dstChain = ccUtil.getSrcChainNameByContractAddr('WAN','WAN');
        console.log(JSON.stringify(dstChain, null, 4));

        ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', input);
        console.log(ret.result);
    }

    return 0;
}

async function main() {
    await setup.init();

    await testLock();    

    console.log("Bye");
}

main();
