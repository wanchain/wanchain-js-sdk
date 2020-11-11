const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

async function sendTx() {
  let dataPath = tool.getInputPath('sendTx');
  let txs = JSON.parse(tool.readFromFile(dataPath));
  let i = 0;
  for (; i < txs.length; i++) {
    let tx = txs[i];
    let txHash = await scTool.sendSerializedTx(tx.data);
    let success = await scTool.waitReceipt(txHash, false);
    if (success) {
      tool.logger.info("send tx %d(%s) to %s success", i + 1, tx.method, tx.toAddress);
      continue;
    } else {
      tool.logger.error("send tx %d(%s) to %s failed", i + 1, tx.method, tx.toAddress);
      break;
    }
  }
  return i;
}

module.exports = sendTx;