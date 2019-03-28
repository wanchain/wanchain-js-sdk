/**
 * creatBTCAddress
 */

let param  = require('./input.json');
let setup  = require('../setup');
let hdUtil = require("../../../src/api/hdUtil");

let fs = require('fs');

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

    await hdUtil.newKeyStoreWallet(password);

    let walletID = 5;
    let path = "m/44'/5718350'/0'/0/0";
    let chain = "WAN";
    let keystore = '{"address":"385f3d29fa5832a624b1566fa00a905b3557b406","crypto":{"cipher":"aes-128-ctr","ciphertext":"472d1ef672b1768aefc334ee8a54f55c93d60e5b08722fe888fdabe54eb00b7b","cipherparams":{"iv":"cfa399fc82301418fde34485c7ea593f"},"mac":"9acc093525a7cf78b6649fc6481b2e8a0c66706fc0b2a8ee9e6c17e665d293ba","kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"r":1,"p":8,"salt":"66153e8895ad24fc3661b80d6c6a1e2c4a2d82bf78b95f44a8f55b178ffa7bb6"}},"id":"70c4c23a-d01d-4138-af17-02606544ccd2","version":3,"crypto2":{"cipher":"aes-128-ctr","ciphertext":"dcefe391d3e96953e633a3aa7d222902d7a16962cf3118c9cdcb2683cad5760c","cipherparams":{"iv":"4c2e39f4a4dd94ad28b572d15b3142e4"},"mac":"cb54e6c492235c9a141ce3be822eb81188f6a0c0efa9be1783ae81606555c4d0","kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"r":1,"p":8,"salt":"b20ffd09e851bae49c92e107d323d1464306ea1044b48657bf0812dd1f5b03f0"}},"waddress":"02e7b5678eAd79fb7ecFf303D521b891A643De1eef0dcc4268BeE60E23e01B4dD403112BdEA598E4058d1eB64D0e0708A692aAfeDF781B99C189905e02a99a2AA571"}'

    hdUtil.importKeyStore(path, keystore);

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
