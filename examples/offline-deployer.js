const p = require('path');
var { config } = require('./conf/config');
const WalletCore  = require("../index").walletCore;
const hdUtil = require("../index").hdUtil;
const offlineDeployer = require("../index").offlineDeployer;

async function main() {
  /* init wallet */
  config.walletPathPrex = p.join('C:/Users/zhangwei/AppData/Roaming/Electron/Db', 'walletDB');
  config.databasePathPrex = p.join('C:/Users/zhangwei/AppData/Roaming/Electron/Db', `${config.network}DB`, 'sdk');
  walletCore = new WalletCore(config);
  await walletCore.init();

  let phrase = hdUtil.revealMnemonic("wallet-password");
  hdUtil.initializeHDWallet(phrase);
  // hdUtil.newKeyStoreWallet("wallet-password");

  /******** TRX ********/
  const tronRefBlock = {
    "number": 28882446,
    "hash": "0000000001b8b60ecc475bd02791a438c1ea27c4b1bbb1728d3c603d1ae486eb",
    "timestamp": 1660276839000
  };

  let txs = require("./offline-txs.json");

  txs.map(tx => {
    if (tx.chain === "TRX") {
      if (!tx['refBlock']) {
        tx['refBlock'] = tronRefBlock;
      }
    }
    if (!tx._wallet) {
      let chain = global.chainManager.getChain(tx.chain);
      let account = hdUtil.getUserAccountForChain(chain.id, tx.from);
      console.log({account})
      tx._wallet = {path: account.path, id: account.id};
    }
  });

  await offlineDeployer.buildTx(txs);
  await offlineDeployer.setFilePath('sendTx', p.join(config.databasePathPrex, 'offlineDeployer/txData/offline-signed-2022-08-12.dat'));
  await offlineDeployer.sendTx();

  console.log("offlineDeployer finished");
}

main();