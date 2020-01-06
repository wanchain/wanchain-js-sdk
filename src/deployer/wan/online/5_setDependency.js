const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

async function set(data, index) {
  if (index >= data.length) {
    // console.log("setDependency finished");
    return true;
  }
  let tx = data[index];
  let txName = tx.name;
  let txData = tx.data;
  let txHash = await scTool.sendSerializedTx(txData);
  let success = await scTool.waitReceipt(txHash, false);
  if (success) {
    console.log(txName + " success");
    return set(data, index + 1);
  } else {
    console.log(txName + " failed");
    return false;
  }
}

async function setDependency() {
  let dataPath = tool.getInputPath('setDependency');
  let data = JSON.parse(tool.readFromFile(dataPath));
  return await set(data, 0);
}

module.exports = setDependency;