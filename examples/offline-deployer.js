const p = require('path');
var { config } = require('./conf/config');
const WalletCore  = require("../index").walletCore;
const hdUtil = require("../index").hdUtil;
const offlineDeployer = require("../index").offlineDeployer;

async function main() {
  /* init wallet */
  const dbDir = 'C:/Users/xxx/AppData/Roaming/Electron/Db';
  config.walletPathPrex = p.join(dbDir, 'walletDB');
  config.databasePathPrex = p.join(dbDir, `${config.network}DB`, 'sdk');
  walletCore = new WalletCore(config);
  await walletCore.init();

  let phrase = hdUtil.revealMnemonic("wallet-password");
  hdUtil.initializeHDWallet(phrase);
  // hdUtil.newKeyStoreWallet("wallet-password");

  const refBlock = {
    TRX: {
      "number": 57347984,
      "hash": "00000000036b0f90acd3f672cbf2c301a6e794d86d60df9030641e643feb5580",
      "timestamp": 1748427354000
    },
    VET: "0x014d38287c2476ba"
  };

  let txs = require("./offline-txs-vet.json");

  txs.map(tx => {
    if (["TRX", "VET"].includes(tx.chain)) {
      if (!tx['refBlock']) {
        tx.refBlock = refBlock[tx.chain];
      }
    }
    if (!tx._wallet) {
      let chain = global.chainManager.getChain(tx.chain);
      let account = hdUtil.getUserAccountForChain(chain.id, tx.from);
      tx._wallet = {path: account.path, id: account.id};
    }
  });

  let signedTxs = await offlineDeployer.signTx(txs);
  await offlineDeployer.sendTx(JSON.parse(signedTxs));

  console.log("offlineDeployer finished");
}

main();