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
      tool.logger.info("send %s tx to %s success", tx.method, tx.toAddress);
      continue;
    } else {
      tool.logger.error("send %s tx to %s failed", tx.method, tx.toAddress);
      break;
    }
  }
  if (i == txs.length) {
    return true;
  } else {
    tool.logger.error("sendTx failed");
    return false;
  }
}

module.exports = sendTx;