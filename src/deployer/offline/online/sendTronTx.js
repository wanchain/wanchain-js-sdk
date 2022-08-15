const scTool = require('../utils/tronScTool');

async function sendTx(tx) {
  let chain = tx.chain;
  let txHash = await scTool.sendSerializedTx(chain, tx.signedTx);
  let success = await scTool.waitReceipt(chain, txHash);
  return success;
}

module.exports = sendTx;