const scTool = require('../utils/veChainScTool');

async function sendTx(tx) {
  let chain = tx.chain;
  let success = await scTool.sendSerializedTx(chain, tx.signedTx);
  return success;
}

module.exports = sendTx;