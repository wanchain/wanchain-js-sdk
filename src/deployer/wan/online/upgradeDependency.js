const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

async function upgrade(data, index) {
  if (index >= data.length) {
    // tool.logger.info("upgradeDependency finished");
    return true;
  }
  let tx = data[index];
  let txName = tx.name;
  let txData = tx.data;
  let txHash = await scTool.sendSerializedTx(txData);
  let success = await scTool.waitReceipt(txHash, false);
  if (success) {
    tool.logger.info(txName + " success");
    return await upgrade(data, index + 1);
  } else {
    tool.logger.error("failed to %s", txName);
    return false;
  }
}

async function upgradeDependency() {
  let dataPath = tool.getInputPath('upgradeDependency');
  let data = JSON.parse(tool.readFromFile(dataPath));
  let success = await upgrade(data, 0);
  if (success == false) {
    tool.logger.error("upgradeDependency failed");
  }
  return success;
}

module.exports = upgradeDependency;