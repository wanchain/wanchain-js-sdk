/**
 * creatBTCAddress
 */

const bitcoin = require('bitcoinjs-lib');

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
let gasPrice = 200000000000;
let gasLimit = 1000000;

let storemanWanAddr = '0x9ebf2acd509e0d5f9653e755f26d9a3ddce3977c';
let storemanBtcAddr = '0x83e5ca256c9ffd0ae019f98e4371e67ef5026d2d';

async function testAddr() {
    let passwd = 'welcome1';
    //
    // 1. construct UTXO for transfer
    let addrList;
    addrList = btcUtil.getAddressList();
    console.log("Address list 1: ", JSON.stringify(addrList, null, 2));
    // returned address list is sorted
    if (addrList.length > 0) {
        let addr = addrList[0];
        //console.log(addr);
        let kp = await btcUtil.getECPairsbyAddr(password, addr.address);

        let senderH160Addr = bitcoin.crypto.hash160(kp.publicKey).toString('hex');
        console.log("H160Addr:", senderH160Addr);
        let from = btcUtil.hash160ToAddress(senderH160Addr, 'pubkeyhash', bitcoin.networks.testnet);
        console.log("from:", from);

    } else {
        console.log("No address");
    }

    return 0;
}

async function main() {
    await setup.init();

    await testAddr();    

    console.log("Bye");
}

main();
