const p = require('path');
var { config } = require('./conf/config');
const WalletCore = require("../index").walletCore;
const hdUtil = require("../index").hdUtil;
const wanDexDeployer = require("../index").wanDexDeployer;

async function main() {
  /* init wallet */
  config.walletPathPrex = p.join('/Users/molin/Library/Application Support/Wan Wallet/test/Db', 'walletDB');
  config.databasePathPrex = p.join('/Users/molin/Library/Application Support/Wan Wallet/test/Db', `${config.network}DB`, 'sdk');

  walletCore = new WalletCore(config);
  await walletCore.init();

  let phrase = hdUtil.revealMnemonic("");
  hdUtil.initializeHDWallet(phrase);
  // hdUtil.newKeyStoreWallet("Wanglu1")

  /* select account */
  let walletId = 1;
  let path = "m/44'/5718350'/0'/0/0";

  /******** WAN ********/
  /* deploy contract */
  await wanDexDeployer.initNonce(walletId, path);             // prepare for offline

  wanDexDeployer.setFilePath('deployPrepareContract', '/Users/molin/Library/Application Support/Wan Wallet/test/Db/testnetDB/sdk/wanDexDeployer/buildPrepareContract(step1).json');
  wanDexDeployer.setFilePath('buildExchangeContract', '/Users/molin/Library/Application Support/Wan Wallet/test/Db/testnetDB/sdk/wanDexDeployer/deployPrepareContract(step2).json');
  wanDexDeployer.setFilePath('deployExchangeContract', '/Users/molin/Library/Application Support/Wan Wallet/test/Db/testnetDB/sdk/wanDexDeployer/buildExchangeContract(step3).json');
  wanDexDeployer.setFilePath('buildProxyConfig', '/Users/molin/Library/Application Support/Wan Wallet/test/Db/testnetDB/sdk/wanDexDeployer/deployExchangeContract(step4).json');
  wanDexDeployer.setFilePath('sendProxyConfig', '/Users/molin/Library/Application Support/Wan Wallet/test/Db/testnetDB/sdk/wanDexDeployer/buildProxyConfig(step5).json');
  wanDexDeployer.setFilePath('buildRelayerDelegate', '/Users/molin/Library/Application Support/Wan Wallet/test/Db/testnetDB/sdk/wanDexDeployer/sendProxyConfig(step6).json');
  wanDexDeployer.setFilePath('sendRelayerDelegate', '/Users/molin/Library/Application Support/Wan Wallet/test/Db/testnetDB/sdk/wanDexDeployer/buildRelayerDelegate(step7).json');
  wanDexDeployer.setFilePath('buildRelayerApprove', '/Users/molin/Library/Application Support/Wan Wallet/test/Db/testnetDB/sdk/wanDexDeployer/sendRelayerDelegate(step8).json');
  wanDexDeployer.setFilePath('sendRelayerApprove', '/Users/molin/Library/Application Support/Wan Wallet/test/Db/testnetDB/sdk/wanDexDeployer/buildRelayerApprove(step9).json');
  wanDexDeployer.setFilePath('token_address', '/Users/molin/Library/Application Support/Wan Wallet/test/Db/testnetDB/sdk/wanDexDeployer/token_address(engineer).json');
  wanDexDeployer.setFilePath('delegate_address', '/Users/molin/Library/Application Support/Wan Wallet/test/Db/testnetDB/sdk/wanDexDeployer/delegate_address(engineer).json');
  console.log("⭐️------------------------------------------");
  // console.log("step1:", await wanDexDeployer.buildPrepareContract(walletId, path));	    // step 1
  // console.log("step2:", await wanDexDeployer.deployPrepareContract());	                // step 2
  // console.log("step3:", await wanDexDeployer.buildExchangeContract(walletId, path));	  // step 3
  // console.log("step4:", await wanDexDeployer.deployExchangeContract());	                // step 4
  // console.log("step5:", await wanDexDeployer.buildProxyConfig(walletId, path));	        // step 5
  // console.log("step6:", await wanDexDeployer.sendProxyConfig());	                      // step 6
  // console.log("step7:", await wanDexDeployer.buildRelayerDelegate(walletId, path));	    // step 7
  // console.log("step8:", await wanDexDeployer.sendRelayerDelegate());	                  // step 8
  // console.log("step9:", await wanDexDeployer.buildRelayerApprove(walletId, path));	    // step 9
  // console.log("step10:", await wanDexDeployer.sendRelayerApprove());	                  // step 10
  console.log("step11:", await wanDexDeployer.verifySmartContract());	                  // step 11
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