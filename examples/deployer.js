const p = require('path');
var { config } = require('./conf/config');
const WalletCore  = require("../index").walletCore;
const hdUtil = require("../index").hdUtil;
const wanDeployer = require("../index").wanDeployer;
const ethDeployer = require("../index").ethDeployer;

async function main(){
  /* init wallet */
  config.walletPathPrex = p.join('C:/Users/Grant/AppData/Roaming/Wan Wallet/Db', 'walletDB');
  config.databasePathPrex = p.join('C:/Users/Grant/AppData/Roaming/Wan Wallet/Db', `${config.network}DB`, 'sdk');

	walletCore = new WalletCore(config);
	await walletCore.init();

  let phrase = hdUtil.revealMnemonic("wallet-password");
  hdUtil.initializeHDWallet(phrase);

  /* select account */
  let walletId = 1;
  let path = "m/44'/5718350'/0'/0/0";

  /******** WAN ********/

  /* deploy lib */
  // wanDeployer.setFilePath('libAddress', wanDeployer.getOutputPath('libAddress')); // deployLib also dependents on libAddress
  // await wanDeployer.deployLib(walletId, path);             // step 1

  /* deploy contract */
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

  /* upgrade */
  // await wanDeployer.initNonce(walletId, path);
  // wanDeployer.setFilePath('libAddress', wanDeployer.getOutputPath('libAddress'));
  // wanDeployer.setFilePath('contractAddress', wanDeployer.getOutputPath('contractAddress'));
  // wanDeployer.setUpgradeComponents(['lib', 'tokenManager', 'htlc', 'storemanGroupAdmin']);
  // await wanDeployer.buildUpgradeContract(walletId, path);
  // wanDeployer.setFilePath('upgradeContract', wanDeployer.getOutputPath('upgradeContract'));
  // await wanDeployer.upgradeContract();
  // wanDeployer.setFilePath('upgradeContractAddress', wanDeployer.getOutputPath('upgradeContractAddress'));
  // await wanDeployer.buildUpgradeDependency(walletId, path);
  // wanDeployer.setFilePath('upgradeDependency', wanDeployer.getOutputPath('upgradeDependency'));
  // await wanDeployer.upgradeDependency();

  /* update */
  // await wanDeployer.initNonce(walletId, path);
  // wanDeployer.setFilePath('contractAddress', wanDeployer.getOutputPath('contractAddress'));
  // await wanDeployer.buildUpdate.buildUpdateHtlcEconomics(walletId, path, 10);
  // let smgArray = require('d:/smg.json');
  // let smg = smgArray[0];
  // await wanDeployer.buildUpdate.buildStoremanGroupUnregister(walletId, path, smg.tokenOrigAccount, smg.storemanGroup);
  // await wanDeployer.buildUpdate.buildStoremanGroupWithdrawDeposit(walletId, path, smg.tokenOrigAccount, smg.storemanGroup);
  // wanDeployer.setFilePath('update', wanDeployer.getOutputPath('update'));
  // await wanDeployer.update.updateHtlcEconomics();
  // await wanDeployer.update.storemanGroupUnregister();
  // await wanDeployer.update.storemanGroupWithdrawDeposit();

  /* test contract dependency (mainnet & testnet) and function (testnet only) */
  // wanDeployer.setFilePath('contractAddress', wanDeployer.getOutputPath('contractAddress'));
  // wanDeployer.setFilePath('token', 'd:/token.json');
  // wanDeployer.setFilePath('smg', 'd:/smg.json');
  // await wanDeployer.testDependency('0x393E86756d8d4CF38493CE6881eb3A8f2966Bb27', '0x393E86756d8d4CF38493CE6881eb3A8f2966Bb27');
  // if (config.network == 'testnet') {
  //   // need to register a storeman group whose private key is known
  //   await wanDeployer.testFunction(walletId, path);
  // }

  /* check var, such as owner, halted, dependency contract address */
  // let name = 'owner';
  // let value = await wanDeployer.getContractVar('HTLCWAN', '0x27feb1785f61504619a105faa00f57c49cc4d9c3', name);
  // console.error("HTLCWAN %s: %s", name, value);

  /* deploy wusdt: 0xb67810a49bad2d4e31159e112734dd7caa99a522 */

  // try {
  //   let compiled = wanDeployer.compileContract('TetherToken');
  //   let initialSupply = 100000000000000;
  //   let name = 'WRC20 USDT';
  //   let symbol = 'WUSDT';
  //   let decimals = 6;
  //   await wanDeployer.deployContractExt('TetherToken', compiled, walletId, path, initialSupply, name, symbol, decimals);
  // } catch (e) {
  //   console.error("deploy TetherToken failed: %O", e);
  // }

  /* deploy wbtc: 0x3ff928f3d8aff9d29ddd5e796760e884aca0a29f */

  try {
    let compiled = wanDeployer.compileContract('WanToken');
    let initialSupply = 2100000000000000;
    let tokenName = 'WRC20 BTC';
    let tokenSymbol = 'WBTC';
    let tokenDecimal = 8;
    let address = await wanDeployer.deployContractExt('WanToken', compiled, walletId, path, tokenName, tokenSymbol, tokenDecimal);
    await wanDeployer.mintWanToken(walletId, path, address, '0x165d1526ecbb8f3dad789c640c5b0d6a3d499496', initialSupply);
  } catch (e) {
    console.error("deploy WBTC failed: %O", e);
  }

  // console.log("wanDeployer finished");

  /******** ETH ********/

  let ethWalletId = 1;
  let ethPath = "m/44'/60'/0'/0/0";

  /* deploy usdt */

  // try {
  //   let compiled = ethDeployer.compileContract('TetherToken');
  //   let initialSupply = 100000000000000;
  //   let name = 'USDT for Wanchain';
  //   let symbol = 'USDT';
  //   let decimals = 6;
  //   await ethDeployer.deployContract('TetherToken', compiled, ethWalletId, ethPath, initialSupply, name, symbol, decimals);
  // } catch (e) {
  //   console.error("deploy TetherToken failed: %O", e);
  // }

  // console.log("ethDeployer finished");
}

main();