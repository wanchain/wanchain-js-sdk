const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

/*
  tx struct: {
    toAddress: required, contract address
    abi: required
    method: required
    paras: optional, default is []
    value: optional, default is 0
  }
*/

async function buildTx(walletId, path, txs) {
  let output = [];

  try {
    let sender = await scTool.path2Address(walletId, path);
    let nonce = tool.getNonce(sender);

    for (let i = 0; i < txs.length; i++) {
      let tx = txs[i];
      let to = tx.toAddress.toLowerCase();
      let paras = tx.paras || [];
      let txData = '';
      if (tx.method && tx.abi) {
        txData = scTool.buildScTxData(to, tx.abi, tx.method, paras);
      }
      let value = (tx.value)? tx.value.toString() : '0';
      let serialized = await scTool.serializeTx(txData, nonce, to, value, walletId, path);
      output.push({toAddress: tx.toAddress, method: tx.method, sender, nonce, paras: paras, value: tx.value, data: serialized});
      nonce++;
    }

    let filePath = tool.getOutputPath('sendTx', sender);
    tool.write2file(filePath, JSON.stringify(output));
    tool.logger.info("tx are serialized to %s", filePath);

    // update nonce
    tool.updateNonce(sender, nonce);

    return true;
  } catch (e) {
    tool.logger.error("buildTxs failed: %O", e);
    return false;
  }
}

module.exports = buildTx;