const tool = require('../utils/tool');
const scTool = require('../utils/scTool');
const contractAddress = require('../contractAddress');

async function register(data, index) {
  if (index >= data.length) {
    // console.log("registerToken finished");
    return true;
  }
  let token = data[index];
  let symbol = token.symbol;
  let txData = token.data;
  let txHash = await scTool.sendSerializedTx(txData);
  let success = await scTool.waitReceipt(txHash, false);
  if (success) {
    let tmProxyAddr = contractAddress.getAddress('TokenManagerProxy');
    let tm = await scTool.getDeployedContract('TokenManagerDelegate', tmProxyAddr);
    let log = await scTool.getTxLog(txHash, tm, 'TokenAddedLogger', 0);
    let address = log.tokenWanAddr;
    contractAddress.setAddress(symbol, address);
    console.log("registered %s token address: %s", symbol, address);
    return register(data, index + 1);
  } else {
    console.error("failed to register %s token", symbol);
    return false;
  }
}

async function registerToken() {
  let dataPath = tool.getInputPath('registerToken');
  let data = JSON.parse(tool.readFromFile(dataPath));
  let success = await register(data, 0);
  if (success == false) {
    console.error("registerToken failed");
  }
  return success;  
}

module.exports = registerToken;