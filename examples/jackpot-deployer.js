const p = require('path');
var { config } = require('./conf/config');
const WalletCore = require("../index").walletCore;
const hdUtil = require("../index").hdUtil;
const wanJackPotDeployer = require("../index").wanJackPotDeployer;

async function main() {
  /* init wallet */
  config.walletPathPrex = p.join('/Users/molin/Library/Application Support/Wan Wallet/test/Db', 'walletDB');
  config.databasePathPrex = p.join('/Users/molin/Library/Application Support/Wan Wallet/test/Db', `${config.network}DB`, 'sdk');

  walletCore = new WalletCore(config);
  await walletCore.init();

  let phrase = hdUtil.revealMnemonic("YourPassWordHere");
  hdUtil.initializeHDWallet(phrase);
  // hdUtil.newKeyStoreWallet("Wanglu1")

  /* select account */
  let walletId = 1;
  let path = "m/44'/5718350'/0'/0/0";

  /******** WAN ********/
  /* deploy contract */
  await wanJackPotDeployer.initNonce(walletId, path);             // prepare for offline

  wanJackPotDeployer.setFilePath('deployJackPotContract', '/Users/molin/Library/Application Support/Wan Wallet/test/Db/testnetDB/sdk/wanJackPotDeployer/buildJackPotContract(step1).json');
  wanJackPotDeployer.setFilePath('buildJackPotConfig', '/Users/molin/Library/Application Support/Wan Wallet/test/Db/testnetDB/sdk/wanJackPotDeployer/deployJackPotContract(step2).json');
  wanJackPotDeployer.setFilePath('sendJackPotConfig', '/Users/molin/Library/Application Support/Wan Wallet/test/Db/testnetDB/sdk/wanJackPotDeployer/buildJackPotConfig(step3).json');
  wanJackPotDeployer.setFilePath('jackpotConfig', '/Users/molin/Library/Application Support/Wan Wallet/test/Db/testnetDB/sdk/wanJackPotDeployer/jackpot-offline-config.json');

 
  console.log("⭐️------------------------------------------");
  console.log("step1:", await wanJackPotDeployer.buildJackPotContract(walletId, path));	    // step 1
  console.log("step2:", await wanJackPotDeployer.deployJackPotContract());	                // step 2
  console.log("step3:", await wanJackPotDeployer.buildJackPotConfig(walletId, path));	  // step 3
  console.log("step4:", await wanJackPotDeployer.sendJackPotConfig());	                // step 4
  
  console.log("💗------------------------------------------");
}


async function startRun() {
  try {
    await main();
  } catch (error) {
    console.log(error);
  }

  process.exit();
}

startRun();
