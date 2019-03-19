/**
 * creatBTCAddress
 */

let param  = require('./input.json');
let setup  = require('../setup');
let hdUtil = require("../../../src/api/hdUtil");
let ccUtil = require("../../../src/api/ccUtil");

/**
 * Transfer parameter
 */

async function testTransfer() {
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
        console.log("Error: no mnemonic");
        return Promise.reject("No mnemonic");
    }

    hdUtil.initializeHDWallet(mnemonic);


    let asset    = param.hd.transfer.asset;
    let walletID = param.hd.transfer.from.walletID;
    let path = param.hd.transfer.from.path;

    let addr = await hdUtil.getAddress(walletID, asset, path);
    let from = '0x' + addr.address;
    console.log(from);

    let balance = await ccUtil.getWanBalance(from);

    console.log("balance: ", balance);

    let input = {
        symbol: 'WAN',
        from: from,
        to: param.hd.transfer.to.address,
        amount: param.hd.transfer.amount,
        gasPrice: param.gasPrice,
        gasLimit: param.gasLimit,
        password: password,
        BIP44Path: path,
        walletID : walletID
    }

    let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(assetName, assetName);

    let ret = await global.crossInvoker.invokeNormalTrans(srcChain, input);

    console.log("Transfer result: ", ret);

    return Promise.resolve("OK");
}

async function main() {
    await setup.init();

    await testTransfer();    

    setup.shutdown();

    console.log("Bye");
}

main();
