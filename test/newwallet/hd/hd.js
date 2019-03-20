/**
 * creatBTCAddress
 */

let param  = require('./input.json');
let setup  = require('../setup');
let hdUtil = require("../../../src/api/hdUtil");

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

    //let address = await hdUtil.getAddress(1, 'WAN', path);
    let address = await hdUtil.getAddress(1, 'WAN', 0, 5);
    console.log("Address: ", JSON.stringify(address, null, 4));

    let wan = global.chainManager.getChain('WAN');
    let tx = {
         nonce: '0x00',
         gasPrice: '0x09184e72a000',
         gasLimit: '0x2710',
         to: '0x0000000000000000000000000000000000000000',
         value: '0x00',
         data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057',
         chainId: 3
    }

    let signedTx = await wan.signTransaction(1, tx, path);
    console.log("Signed tx: ", signedTx.toString('hex'));

    return Promise.resolve("OK");
}

async function main() {
    await setup.init();

    await testHD();    

    setup.shutdown();

    console.log("Bye");
}

main();
