/**
 */

global.wanchain_js_testnet = true;
let config      = require('./config.json');
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
        // To shutdown:
        // Need to call walletCore.close, and in walletCore.close
        // needs to clear time and close socket;
        // But the websocket reconnects on close,
        // so leave with it or there's requirement for gracefull shutdown!
        walletCore.close();
        console.log("Shutdown test environment done");
    }
}
