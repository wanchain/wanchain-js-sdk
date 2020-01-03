const tool = require('../utils/tool');
const scTool = require('../utils/scTool');
const contractAddress = require('../contractAddress');

async function deploy(data, index) {
  if (index >= data.length) {
    // console.log("deployContract finished");
    return true;
  }
  let sc = data[index];
  let scName = sc.name;
  let scData = sc.data;
  let txHash = await scTool.sendSerializedTx(scData);
  let address = await scTool.waitReceipt(txHash, true);
  if (address) {
    contractAddress.setAddress(scName, address);
    console.log("deployed %s address: %s", scName, address);
    return deploy(data, index + 1);
  } else {
    console.log("deploy %s failed", scName);
    return false;
  }
}

async function deployContract() {
  let dataPath = tool.getOutputPath('deployContract');
  let data = JSON.parse(tool.readFromFile(dataPath));
  return await deploy(data, 0);
}

module.exports = deployContract;