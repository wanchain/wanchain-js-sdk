/**
 */

global.wanchain_js_testnet = true;
let config      = require('./config.json');
let Util        = require("../../src/api/ccUtil");
let WalletCore  = require("../../src/core/walletCore");

let walletCore = new WalletCore(config);

module.exports = {
    walletCore,
    
    async init() {
        console.log("Initialize test environment for testnet!");
        await walletCore.init();
        console.log("Test environment initialization done");
    },

    async shutdown() {
        console.log("Shuting down test environment for testnet!");
        //walletCore.close();
        console.log("Shutdown test environment initialization done");
    }
}
