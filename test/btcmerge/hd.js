/**
 * creatBTCAddress
 */

let param  = require('./input.json');
let config = require('./config.json');
let setup  = require('./setup');
let ccUtil = require("../../src/api/ccUtil");
let HDWallet = require("../../src/hdwallet/hdwallet");
let WAN      = require("../../src/hdwallet/wan");

/**
 * Transfer parameter
 */

async function testHD() {
    let password = param.hd.password;
    let strength = param.hd.strength;

    let mnemonic;
    if (ccUtil.hasMnemonic()) {
        mnemonic = ccUtil.revealMnemonic(password);
        console.log("Already has mnemonic: ", mnemonic);
        if (ccUtil.validateMnemonic(mnemonic)) {
            console.log("Mnemonic is valid");
        } else {
            console.log("Mnemonic is invalid");
            return Promise.reject("Mnemonic is invalid");
        }
    } else {
        mnemonic = ccUtil.generateMnemonic(password, strength);
        console.log("Generate mnemonic: ", mnemonic);
    }

    let hdwalletdb = global.hdWalletDB;
    let hdwallet = HDWallet.fromMnemonic(mnemonic);
    let wanChain = new WAN(hdwallet, hdwalletdb);

    let path = "m/44'/60'/0'/0/0";
    let addr = await wanChain.getAddress(path);
    console.log(JSON.stringify(addr, null, 4));

    addr = await wanChain.getAddress(0, 5);
    console.log(JSON.stringify(addr, null, 4));

    return Promise.resolve("OK");
}

async function main() {
    await setup.init();

    await testHD();    

    setup.shutdown();

    console.log("Bye");
}

main();
