const path = require('path');
const tool = require('../utils/tool');
const scTool = require('../utils/scTool');
const smgArray = require('../smg.json');

const txDataDir = tool.getOutputPath('txData');

async function registerSmg(index) {
  if (index == undefined) {
    index = 0;
  } else if (index >= smgArray.length) {
    // console.log("regSmg finished");
    return true;
  }
  let symbol = smgArray[index].tokenSymbol;
  let txFile = path.join(txDataDir, "registerSmg" + symbol + ".dat");
  let txHash = await scTool.sendSerializedTx(txFile);
  let success = await scTool.waitReceipt(txHash, false);
  if (success) {
    console.log("register storemanGroup for %s token success", symbol);
    return registerSmg(index + 1);
  } else {
    console.log("register storemanGroup for %s token failed", symbol);
    return false;
  }
}

module.exports = registerSmg;