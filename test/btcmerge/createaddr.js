/**
 * creatBTCAddress
 */

let setup  = require('./setup');
let btcUtil= require("../../src/api/btcUtil");
let ccUtil = require("../../src/api/ccUtil");

async function testLoadAddr() {
    let passwd = 'welcome1';
    let btcAddr = btcUtil.getBtcWallet();
    if (Array.isArray(btcAddr) && (btcAddr.length > 0)) {
        let result = btcAddr[0];

        let encryptedKey = result.encryptedKey;
        await btcUtil.decryptedWIF(encryptedKey, passwd);

        console.log("Address 0: ", result); 

        return result;
    }
    return null;
}

async function createNewAddr() {
    let passwd = 'welcome1';
    let addr   = await btcUtil.createBTCAddress(passwd);
    console.log("New address:", addr);
    return addr;
}

async function main() {
    await setup.init();
    
    let addr = await testLoadAddr();

    console.log("Import address: ", addr.address);
    await ccUtil.btcImportAddress(addr.address);
}

main();
