const path = require('path');
const tool = require('../utils/tool');
const scTool = require('../utils/scTool');
const contractAddress = require('../contractAddress');

const scArray = [
  // deploy TokenManager
  'TokenManagerProxy',
  'TokenManagerDelegate',
  // deploy HTLC
  'HTLCProxy',
  'HTLCDelegate',
  // deploy StoremanGroupAdmin
  'StoremanGroupProxy',
  'StoremanGroupDelegate'
]

async function deployContract(index) {
  if (index == undefined) {
    index = 0;
  } else if (index >= scArray.length) {
    // console.log("deployContract finished");
    return true;
  }

  let scName = scArray[index];
  let txDataDir = tool.getOutputPath('txDataDir');
  let txFile = path.join(txDataDir, "deploy" + scName + ".dat");
  let txHash = await scTool.sendSerializedTx(txFile);
  let address = await scTool.waitReceipt(txHash, true);
  if (address) {
    contractAddress.setAddress(scName, address);
    console.log("deployed %s address: %s", scName, address);
    return deployContract(index + 1);
  } else {
    console.log("deploy %s failed", scName);
    return false;
  }
}

module.exports = deployContract;