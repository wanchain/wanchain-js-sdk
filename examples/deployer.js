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

  // deploy lib
  wanDeployer.setFilePath('libAddress', wanDeployer.getOutputPath('libAddress')); // deployLib also dependents on libAddress
  await wanDeployer.deployLib(walletId, path);             // step 1

  // deploy contract
  await wanDeployer.initNonce(walletId, path);             // prepare for offline
  await wanDeployer.buildDeployContract(walletId, path);   // step 2
  wanDeployer.setFilePath('deployContract', wanDeployer.getOutputPath('deployContract'));
  await wanDeployer.deployContract();                      // step 3
  wanDeployer.setFilePath('contractAddress', wanDeployer.getOutputPath('contractAddress'));
  await wanDeployer.buildSetDependency(walletId, path);    // step 4
  wanDeployer.setFilePath('setDependency', wanDeployer.getOutputPath('setDependency'));
  await wanDeployer.setDependency();                       // step 5
  wanDeployer.setFilePath('token', 'd:/token.json');
  await wanDeployer.buildRegisterToken(walletId, path);    // step 6
  wanDeployer.setFilePath('registerToken', wanDeployer.getOutputPath('registerToken'));
  await wanDeployer.registerToken();                       // step 7
  wanDeployer.setFilePath('smg', 'd:/smg.json');
  await wanDeployer.buildRegisterSmg(walletId, path);      // step 8
  wanDeployer.setFilePath('registerSmg', wanDeployer.getOutputPath('registerSmg'));
  await wanDeployer.registerSmg();                         // step 9

  // // update
  // await wanDeployer.initNonce(walletId, path);
  // wanDeployer.setFilePath('contractAddress', wanDeployer.getOutputPath('contractAddress'));
  // await wanDeployer.buildUpdate.buildUpdateHtlcEconomics(walletId, path, 10);
  // let tokenOrigAccount = '0x01800000c2656f73696f2e746f6b656e3a454f53';
  // let smg = '0x042c672cbf9858cd77e33f7a1660027e549873ce25caffd877f955b5158a50778f7c852bbab6bd76eb83cac51132ccdbb5e6747ef6732abbb2135ed0da1c341619';
  // await wanDeployer.buildUpdate.buildStoremanGroupUnregister(walletId, path, tokenOrigAccount, smg);
  // wanDeployer.setFilePath('update', wanDeployer.getOutputPath('update'));
  // await wanDeployer.update.updateHtlcEconomics();
  // await wanDeployer.update.storemanGroupUnregister();

  // upgrade
  await wanDeployer.initNonce(walletId, path);
  wanDeployer.setFilePath('libAddress', wanDeployer.getOutputPath('libAddress'));
  wanDeployer.setFilePath('contractAddress', wanDeployer.getOutputPath('contractAddress'));
  wanDeployer.setUpgradeComponents(['lib', 'tokenManager', 'htlc', 'storemanGroupAdmin']);
  await wanDeployer.buildUpgradeContract(walletId, path);
  wanDeployer.setFilePath('upgradeContract', wanDeployer.getOutputPath('upgradeContract'));
  await wanDeployer.upgradeContract();
  wanDeployer.setFilePath('upgradeContractAddress', wanDeployer.getOutputPath('upgradeContractAddress'));
  await wanDeployer.buildUpgradeDependency(walletId, path);
  wanDeployer.setFilePath('upgradeDependency', wanDeployer.getOutputPath('upgradeDependency'));
  await wanDeployer.upgradeDependency();

  // test contract dependency (mainnet & testnet) and function (testnet only)
  wanDeployer.setFilePath('contractAddress', wanDeployer.getOutputPath('contractAddress'));
  wanDeployer.setFilePath('token', 'd:/token.json');
  wanDeployer.setFilePath('smg', 'd:/smg.json');
  await wanDeployer.testDependency('0x393E86756d8d4CF38493CE6881eb3A8f2966Bb27', '0x393E86756d8d4CF38493CE6881eb3A8f2966Bb27');
  if (config.network == 'testnet') {
    // need to register a storeman group whose private key is known
    await wanDeployer.testFunction(walletId, path);
  }

  console.log("wanDeployer finished");
}

main();