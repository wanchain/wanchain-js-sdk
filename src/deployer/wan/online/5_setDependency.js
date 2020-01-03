const path = require('path');
const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

const txArray = [
  // TokenManager dependency
  'setTokenManagerImp',
  'setTokenManagerHtlc',
  // HTLC dependency
  'setHTLCImp',
  'setHTLCEconomics',
  // StoremanGroupAdmin dependency
  'setStoremanGroupAdminImp',
  'setStoremanGroupAdminDependency'
]

async function setDependency(index) {
  if (index == undefined) {
    index = 0;
  } else if (index >= txArray.length) {
    // console.log("setDependency finished");
    return true;
  }
  let txName = txArray[index];
  let txDataDir = tool.getOutputPath('txDataDir');
  let txFile = path.join(txDataDir, txName + ".dat");
  let txHash = await scTool.sendSerializedTx(txFile);
  let success = await scTool.waitReceipt(txHash, false);
  if (success) {
    console.log(txName + " success");
    return setDependency(index + 1);
  } else {
    console.log(txName + " failed");
    return false;
  }
}

module.exports = setDependency;