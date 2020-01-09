const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

async function register(data, index) {
  if (index >= data.length) {
    // tool.logger.info("registerSmg finished");
    return true;
  }
  let smg = data[index];
  let token = smg.token;
  let pk = smg.smg;
  let txData = smg.data;
  let txHash = await scTool.sendSerializedTx(txData);
  let success = await scTool.waitReceipt(txHash, false);
  if (success) {
    tool.logger.info("register storemanGroup %s for %s token success", pk, token);
    return register(data, index + 1);
  } else {
    tool.logger.error("failed to register storemanGroup %s for %s token ", pk, token);
    return false;
  }
}

async function registerSmg() {
  let dataPath = tool.getInputPath('registerSmg');
  let data = JSON.parse(tool.readFromFile(dataPath));
  let success = await register(data, 0);
  if (success == false) {
    tool.logger.error("registerSmg failed");
  }
  return success;    
}

module.exports = registerSmg;