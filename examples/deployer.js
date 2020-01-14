const p = require('path');
var { config } = require('./conf/config');
const WalletCore  = require("../index").walletCore;
const hdUtil = require("../index").hdUtil;
const wanDeployer = require("../index").wanDeployer;

async function main(){
  // init wallet
  config.walletPathPrex = p.join('C:/Users/user/AppData/Roaming/Wan Wallet/Db', 'walletDB');
  config.databasePathPrex = p.join('C:/Users/user/AppData/Roaming/Wan Wallet/Db', `${config.network}DB`, 'sdk');

	walletCore = new WalletCore(config);
	await walletCore.init();

  let phrase = hdUtil.revealMnemonic("Wanglu1");
  hdUtil.initializeHDWallet(phrase);

  // deploy contract
  let walletId = 1;
  let path = "m/44'/5718350'/0'/0/0";

  // deploy lib
  wanDeployer.setFilePath('libAddress', wanDeployer.getOutputPath('libAddress')); // deployLib also dependents on libAddress
  await wanDeployer.deployLib(walletId, path);             // step 1

  // deploy others
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

  console.log("wanDeployer finished");
}

main();