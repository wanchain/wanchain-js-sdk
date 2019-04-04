/**
 */

let param  = require('./input.json');
let hdUtil = require("../../../src/api/hdUtil");

/**
 * Initialize HD wallet
 */
module.exports.initHDWallet = async function(password, strength, opt) {
    password = password || param.hd.password;
    strength = strength || param.hd.mnemonic.strength;
    opt = opt || {};

    let mnemonic;
    let hasMnemonic = hdUtil.hasMnemonic();
    if (hasMnemonic) {
        mnemonic = hdUtil.revealMnemonic(password);
        console.log("Revealed:", mnemonic);
        console.log("Is validate? ", hdUtil.validateMnemonic(mnemonic));
    }else if (opt.generateMnemonic){
        mnemonic = hdUtil.generateMnemonic(password, strength);
        console.log("Generated mnemonic:", mnemonic);
    }

    if (opt.importMnemonic) { 
        hdUtil.initializeHDWallet(opt.mnemonic);
    } else {
        hdUtil.initializeHDWallet(mnemonic);
    }

    if (opt.enableLedger) {
        console.log("Connecting to ledger");
        await hdUtil.connectToLedger();
    }

    if (opt.enableRawkey) {
        console.log("Creating raw key");
        await hdUtil.newRawKeyWallet();
    }

    if (opt.enableKeystore) {
        console.log("Creating key store");
        await hdUtil.newKeyStoreWallet();
    }

};

