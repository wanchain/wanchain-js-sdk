const p = require('path');
var { config } = require('./conf/config');
const WalletCore  = require("../index").walletCore;
const hdUtil = require("../index").hdUtil;
const wanDeployer = require("../index").wanDeployer;

async function main(){
  // init wallet
  config.walletPathPrex = p.join('C:/Users/zhangwei/AppData/Roaming/Wan Wallet/Db', 'walletDB');
  config.databasePathPrex = p.join('C:/Users/zhangwei/AppData/Roaming/Wan Wallet/Db', `${config.network}DB`, 'sdk');

	walletCore = new WalletCore(config);
	await walletCore.init();

  let phrase = hdUtil.revealMnemonic("Wanglu1");
  hdUtil.initializeHDWallet(phrase);
  hdUtil.newKeyStoreWallet("Wanglu1")

  // select account
  let walletId = 1;
  let path = "m/44'/5718350'/0'/0/0";

  // // deploy lib
  // wanDeployer.setFilePath('libAddress', wanDeployer.getOutputPath('libAddress')); // deployLib also dependents on libAddress
  // await wanDeployer.deployLib(walletId, path);             // step 1

  // // deploy contract
  // await wanDeployer.initNonce(walletId, path);             // prepare for offline
  // await wanDeployer.buildDeployContract(walletId, path);   // step 2
  // wanDeployer.setFilePath('deployContract', wanDeployer.getOutputPath('deployContract'));
  // await wanDeployer.deployContract();                      // step 3
  // wanDeployer.setFilePath('contractAddress', wanDeployer.getOutputPath('contractAddress'));
  // await wanDeployer.buildSetDependency(walletId, path);    // step 4
  // wanDeployer.setFilePath('setDependency', wanDeployer.getOutputPath('setDependency'));
  // await wanDeployer.setDependency();                       // step 5
  // wanDeployer.setFilePath('token', 'd:/token.json');
  // await wanDeployer.buildRegisterToken(walletId, path);    // step 6
  // wanDeployer.setFilePath('registerToken', wanDeployer.getOutputPath('registerToken'));
  // await wanDeployer.registerToken();                       // step 7
  // wanDeployer.setFilePath('smg', 'd:/smg.json');
  // await wanDeployer.buildRegisterSmg(walletId, path);      // step 8
  // wanDeployer.setFilePath('registerSmg', wanDeployer.getOutputPath('registerSmg'));
  // await wanDeployer.registerSmg();                         // step 9

  // // update
  // await wanDeployer.initNonce(walletId, path);
  // wanDeployer.setFilePath('contractAddress', wanDeployer.getOutputPath('contractAddress'));
  // await wanDeployer.buildUpdate.buildUpdateHtlcEconomics(walletId, path, 10);
  // wanDeployer.setFilePath('update', wanDeployer.getOutputPath('update'));
  // await wanDeployer.update.updateHtlcEconomics();

  // // upgrade
  // await wanDeployer.initNonce(walletId, path);
  // wanDeployer.setFilePath('libAddress', wanDeployer.getOutputPath('libAddress'));
  // wanDeployer.setUpgradeComponents(['lib', 'htlc', 'tokenManager', 'StoremanGroupAdmin'])
  // await wanDeployer.buildUpgradeContract(walletId, path);
  // wanDeployer.setFilePath('contractAddress', wanDeployer.getOutputPath('contractAddress'));
  // wanDeployer.setFilePath('upgradeContract', wanDeployer.getOutputPath('upgradeContract'));
  // await wanDeployer.upgradeContract();
  // await wanDeployer.buildUpgradeDependency(walletId, path);
  // wanDeployer.setFilePath('upgradeDependency', wanDeployer.getOutputPath('upgradeDependency'));
  // await wanDeployer.upgradeDependency();

  // test
  // need to register a storeman group whose private key is known
  wanDeployer.setFilePath('contractAddress', 'd:/contractAddress(step3).json');
  wanDeployer.setFilePath('token', 'd:/token.json');
  wanDeployer.setFilePath('smg', 'd:/smg.json');
  await wanDeployer.test(walletId, path);

  console.log("wanDeployer finished");
}

main();