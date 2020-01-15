const tool = require('../utils/tool');
const scTool = require('../utils/scTool');
const contractAddress = require('../contractAddress');

async function buildUpgradeDependency(walletId, path, typeArray) {
  let txData, serialized, output = [];

  try {
    let sender = await scTool.path2Address(walletId, path);
    let nonce = tool.getNonce(sender);

    let htlcProxyAddress = contractAddress.getAddress('HTLCProxy');
    let htlcDelegateAddress = contractAddress.getAddress('HTLCDelegate');
   
    if (typeArray.includes('lib')) {
      // upgrade HTLCProxy
      contract = await scTool.getDeployedContract('HTLCProxy', htlcProxyAddress);
      txData = await contract.methods.upgradeTo(htlcDelegateAddress).encodeABI();
      serialized = await scTool.serializeTx(txData, nonce++, htlcProxyAddress, '0', walletId, path);
      output.push({name: 'setHTLCImp', data: serialized});
    } 

    let filePath = tool.getOutputPath('upgradeDependency');
    tool.write2file(filePath, JSON.stringify(output));
    tool.logger.info("tx is serialized to %s", filePath);

    // update nonce
    tool.updateNonce(sender, nonce);

    return true;
  } catch (e) {
    tool.logger.error("buildUpgradeDependency failed: %O", e);
    return false;
  }
}

module.exports = buildUpgradeDependency;