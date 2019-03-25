/**
 * creatBTCAddress
 */

let param  = require('./input.json');
let setup  = require('../setup');
let hdUtil = require("../../../src/api/hdUtil");

/**
 * Transfer parameter
 */

async function testExport() {
    let password = param.hd.password;
    let strength = param.hd.strength;

    let assetName = param.hd.asset.name;
    let assetType = param.hd.asset.coinType;

    let hasMnemonic = hdUtil.hasMnemonic();

    console.log("Has mnemonic already? ", hasMnemonic);

    let mnemonic;
    if (hasMnemonic) {
        mnemonic = hdUtil.revealMnemonic(password);
        console.log("Revealed:", mnemonic);
        console.log("Is validate? ", hdUtil.validateMnemonic(mnemonic));
    }else {
        mnemonic = hdUtil.generateMnemonic(password, strength);
        console.log("Generated mnemonic:", mnemonic);
    }

    hdUtil.initializeHDWallet(mnemonic);

    await hdUtil.newRawKeyWallet(password);

    let walletID = [1, 6];
    let path = "m/44'/5718350'/0'/0/0";
    let chain = "WAN";

    for (let i = 0; i < walletID.length; i++) {
        let wid = walletID[i];
        let privKey = hdUtil.exportPrivateKey(wid, path, password);

        console.log(`Private key for wallet '${wid}': '${privKey}'`);
    }

    return Promise.resolve("OK");
}

async function main() {
    await setup.init();

    await testExport();    

    setup.shutdown();

    console.log("Bye");
}

main();
