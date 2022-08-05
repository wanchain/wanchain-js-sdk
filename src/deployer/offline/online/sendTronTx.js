const tool = require('../utils/tool');
const scTool = require('../utils/tronScTool');

async function sendTx(chain) {
  let dataPath = tool.getInputPath('sendTx');
  let txs = JSON.parse(tool.readFromFile(dataPath));
  let i = 0;
  for (; i < txs.length; i++) {
    let tx = txs[i];
    let txHash = await scTool.sendSerializedTx(chain, tx.data);
    // let success = await scTool.waitReceipt(chain, txHash, false);
    // if (success) {
    //   tool.logger.info("%s send tx %d(%s) to %s success", chain, i + 1, tx.method, tx.toAddress);
    //   continue;
    // } else {
    //   tool.logger.error("%s send tx %d(%s) to %s failed", chain, i + 1, tx.method, tx.toAddress);
    //   break;
    // }
  }
  return i;
}

module.exports = sendTx;