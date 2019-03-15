/**
 * creatBTCAddress
 */

let param  = require('./input.json');
let setup  = require('./setup');
let ccUtil = require("../../src/api/ccUtil");

/**
 * Transfer parameter
 */

async function testMnemonic() {
    let strength = param.hd.strength;
    let password = param.hd.password;


    console.log("Has mnemonic already? ", ccUtil.hasMnemonic());

    let mnemonic = ccUtil.generateMnemonic(password, strength);
    console.log("Generated mnemonic:", mnemonic);
    let revealed = ccUtil.revealMnemonic(password);
    console.log("Revealed:", revealed);

    console.log("Is validate? ", ccUtil.validateMnemonic(revealed));

    return Promise.resolve("OK");
}

async function main() {
    await setup.init();

    await testMnemonic();    

    setup.shutdown();

    console.log("Bye");
}

main();
