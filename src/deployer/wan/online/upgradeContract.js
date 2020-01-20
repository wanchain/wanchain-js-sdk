const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

async function upgrade(data, index) {
  if (index >= data.length) {
    // tool.logger.info("upgradeContract finished");
    return true;
  }
  let sc = data[index];
  let scName = sc.name;
  let scData = sc.data;
  let txHash = await scTool.sendSerializedTx(scData);
  let address = await scTool.waitReceipt(txHash, true);
  if (address) {
    tool.setAddress('upgradeContract', scName, address);
    tool.logger.info("upgrade contract %s address: %s", scName, address);
    return await upgrade(data, index + 1);
  } else {
    tool.logger.error("failed to upgrade contract %s", scName);
    return false;
  }
}

async function upgradeContract() {
  let dataPath = tool.getInputPath('upgradeContract');
  let data = JSON.parse(tool.readFromFile(dataPath));
  let success = await upgrade(data, 0);
  if (success == false) {
    tool.logger.error("upgradeContract failed");
  }
  return success;
}

module.exports = upgradeContract;