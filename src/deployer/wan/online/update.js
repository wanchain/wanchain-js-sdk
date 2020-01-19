const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

function getTxData(name) {
  let dataPath = tool.getInputPath('update');
  let data = JSON.parse(tool.readFromFile(dataPath));

  for (let i = 0; i < data.length; i++) {
    let tx = data[i];
    if (tx.name == name) {
      return tx.data;
    }
  }
  return null;
}

async function sendTxData(txName) {
  let txData = getTxData(txName);
  if (txData == null) {
    tool.logger.error(txName + " failed to get data");
  }
  let txHash = await scTool.sendSerializedTx(txData);
  let success = await scTool.waitReceipt(txHash, false);
  if (success) {
    tool.logger.info(txName + " success");
    return true;
  } else {
    tool.logger.error("failed to %s", txName);
    return false;
  }
}

async function updateHtlcEconomics() {
  return await sendTxData('updateHTLCEconomics');
}

async function storemanGroupUnregister() {
  return await sendTxData('storemanGroupUnregister');
}

module.exports = {
  updateHtlcEconomics,
  storemanGroupUnregister
};