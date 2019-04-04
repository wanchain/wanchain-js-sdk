/**
 * creatBTCAddress
 */

let param  = require('./input.json');
let setup  = require('../setup');
let ccUtil = require("../../../src/api/ccUtil");
let hdUtil = require("../../../src/api/hdUtil");
let util   = require('./util');
/**
 * Transfer parameter
 */
async function testBTC() {

    await util.initHDWallet();
    console.log("Registered chains: ", hdUtil.getRegisteredChains());

    let chain = "BTC";
    let walletID = 1;

    let path = "m/44'/1'/0'/0/0";

    //let address = await hdUtil.getAddress(walletID, chain, 0, 5);
    let address = await hdUtil.getAddress(walletID, chain, path);
    console.log("Address: ", JSON.stringify(address, null, 4));

    // import address
    await ccUtil.btcImportAddress(address.address);

    return Promise.resolve("OK");
}

async function main() {
    await setup.init();

    await testBTC();    

    setup.shutdown();

    console.log("Bye");
}

main();
