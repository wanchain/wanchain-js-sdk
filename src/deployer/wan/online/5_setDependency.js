const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

async function set(data, index) {
  if (index >= data.length) {
    // tool.logger.info("setDependency finished");
    return true;
  }
  let tx = data[index];
  let txName = tx.name;
  let txData = tx.data;
  let txHash = await scTool.sendSerializedTx(txData);
  let success = await scTool.waitReceipt(txHash, false);
  if (success) {
    tool.logger.info(txName + " success");
    return await set(data, index + 1);
  } else {
    tool.logger.error("failed to %s", txName);
    return false;
  }
}

async function setDependency() {
  let dataPath = tool.getInputPath('setDependency');
  let data = JSON.parse(tool.readFromFile(dataPath));
  let success = await set(data, 0);
  if (success == false) {
    tool.logger.error("setDependency failed");
  }
  return success;
}

module.exports = setDependency;