const scTool = require('../utils/scTool');

async function sendTx(tx) {
  let chain = tx.chain;
  let txHash = await scTool.sendSerializedTx(chain, tx.signedTx);
  let success = await scTool.waitReceipt(chain, txHash, false);
  return success;
}

module.exports = sendTx;