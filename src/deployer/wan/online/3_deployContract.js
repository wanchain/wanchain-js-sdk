const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

async function deploy(data, index) {
  if (index >= data.length) {
    // tool.logger.info("deployContract finished");
    return true;
  }
  let sc = data[index];
  let scName = sc.name;
  let scData = sc.data;
  let txHash = await scTool.sendSerializedTx(scData);
  let address = await scTool.waitReceipt(txHash, true);
  if (address) {
    tool.setAddress('contract', scName, address);
    tool.logger.info("deployed contract %s address: %s", scName, address);
    return await deploy(data, index + 1);
  } else {
    tool.logger.error("failed to deploy contract %s", scName);
    return false;
  }
}

async function deployContract() {
  let dataPath = tool.getInputPath('deployContract');
  let data = JSON.parse(tool.readFromFile(dataPath));
  let success = await deploy(data, 0);
  if (success == false) {
    tool.logger.error("deployContract failed");
  }
  return success;
}

module.exports = deployContract;