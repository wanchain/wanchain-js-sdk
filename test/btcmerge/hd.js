/**
 * creatBTCAddress
 */

let param  = require('./input.json');
let setup  = require('./setup');
let hdUtil = require("../../src/api/hdUtil");

/**
 * Transfer parameter
 */

async function testHD() {
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

    console.log("Registered chains: ", hdUtil.getRegisteredChains());

    let path = "m/44'/5718350'/0'/0/0";

    let address = await hdUtil.getAddress('WAN', path);
    console.log("Address: ", JSON.stringify(address, null, 4));

    return Promise.resolve("OK");
}

async function main() {
    await setup.init();

    await testHD();    

    setup.shutdown();

    console.log("Bye");
}

main();
