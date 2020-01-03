const path = require('path');
const tool = require('../utils/tool');
const scTool = require('../utils/scTool');
const contractAddress = require('../contractAddress');

const tmProxyAddr = contractAddress.getAddress('TokenManagerProxy');

async function registerToken(index) {
  let tokenPath = tool.getInputPath('token');
  let tokenArray = require(tokenPath);
  if (index == undefined) {
    index = 0;
  } else if (index >= tokenArray.length) {
    // console.log("regToken finished");
    return true;
  }
  let symbol = tokenArray[index].symbol;
  let txDataDir = tool.getOutputPath('txDataDir');
  let txFile = path.join(txDataDir, "registerToken" + symbol + ".dat");
  let txHash = await scTool.sendSerializedTx(txFile);
  let success = await scTool.waitReceipt(txHash, false);
  if (success) {
    let tm = await scTool.getDeployedContract('TokenManagerDelegate', tmProxyAddr);
    let log = await scTool.getTxLog(txHash, tm, 'TokenAddedLogger', 0);
    let address = log.tokenWanAddr;
    contractAddress.setAddress(symbol, address);
    console.log("registered %s token address: %s", symbol, address);
    return registerToken(index + 1);
  } else {
    console.log("register %s token failed", symbol);
    return false;
  }
}

module.exports = registerToken;