const { config } = require('./conf/config');
const WalletCore  = require("../index").walletCore;
const hdUtil = require("../index").hdUtil;
const deployer = require("../index").deployer;

async function main(){
  // init wallet
	walletCore = new WalletCore(config);
	await walletCore.init();

  let phrase = hdUtil.revealMnemonic("Wanglu1");
  hdUtil.initializeHDWallet(phrase);
  hdUtil.newKeyStoreWallet();

  // deploy contract
  let walletId = 5;
  let path = "m/44'/5718350'/0'/0/0";

  await deployer.deployLib(walletId, path);             // step 1
  await deployer.initNonce(walletId, path);             // prepare for offline
  await deployer.buildDeployContract(walletId, path);   // step 2
  await deployer.deployContract();                      // step 3
  await deployer.buildSetDependency(walletId, path);    // step 4
  await deployer.setDependency();                       // step 5
  await deployer.buildRegisterToken(walletId, path);    // step 6
  await deployer.registerToken();                       // step 7
  await deployer.buildRegisterSmg(walletId, path);      // step 8
  await deployer.registerSmg();                         // step 9
}

main();