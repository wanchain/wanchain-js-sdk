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

    await hdUtil.newRawKeyWallet(password);

    let walletID = 6;
    let path = "m/44'/5718350'/0'/0/0";
    let chain = "WAN";
    let privKey = Buffer.from("a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e", "hex");

    hdUtil.importPrivateKey(path, privKey);
    //let key = await hdUtil.exportPrivateKey(walletID, path, password);
    //console.log(key);

    //let address = await hdUtil.getAddress(walletID, chain, path);
    let address = await hdUtil.getAddress(walletID, chain, 0, 5);
    console.log("Address: ", JSON.stringify(address, null, 4));

    let safe = hdUtil.getWalletSafe();
    let wallets = safe.getWallets();
    console.log("Wallets: ", JSON.stringify(wallets, null, 4));

    let wan = global.chainManager.getChain(chain);
    let tx = {
         Txtype: '0x01',
         nonce: '0x01',
         gasPrice: '0x04e3b29200',
         gasLimit: '0x5208',
         to: '0x28ee52a8f3d6e5d15f8b131996950d7f296c7952', 
         value: '0x2bd72a24874000',
         data: null,
         chainId:'0x01'
    }

    let signedTx = await wan.signTransaction(walletID, tx, path);
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
