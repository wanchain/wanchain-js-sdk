const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

async function buildUpgradeDependency(walletId, path) {
  let txData, serialized, output = [];

  let components = global.deployerContext.upgradeComponents;
  if ((!components) || (components.length == 0)) {
    tool.logger.error("upgrade components are not set");
    return false;
  }

  try {
    let sender = await scTool.path2Address(walletId, path);
    let nonce = tool.getNonce(sender);

    let tmProxyAddress = tool.getAddress('contract', 'TokenManagerProxy');
    let tmDelegateAddress = tool.getAddress('contract', 'TokenManagerDelegate');
    let htlcProxyAddress = tool.getAddress('contract', 'HTLCProxy');
    let htlcDelegateAddress = tool.getAddress('contract', 'HTLCDelegate');
    let smgProxyAddress = tool.getAddress('contract', 'StoremanGroupProxy')
    let smgDelegateAddress = tool.getAddress('contract', 'StoremanGroupDelegate');
   
    if (components.includes('tokenManager')) {
      // upgrade TokenManagerProxy
      contract = await scTool.getDeployedContract('TokenManagerProxy', tmProxyAddress);
      txData = await contract.methods.upgradeTo(tmDelegateAddress).encodeABI();
      serialized = await scTool.serializeTx(txData, nonce++, tmProxyAddress, '0', walletId, path);
      output.push({name: 'setTokenManagerImp', data: serialized});
    }

    if (components.includes('lib') || components.includes('htlc')) {
      // upgrade HTLCProxy
      contract = await scTool.getDeployedContract('HTLCProxy', htlcProxyAddress);
      txData = await contract.methods.upgradeTo(htlcDelegateAddress).encodeABI();
      serialized = await scTool.serializeTx(txData, nonce++, htlcProxyAddress, '0', walletId, path);
      output.push({name: 'setHTLCImp', data: serialized});
    }

    if (components.includes('storemanGroupAdmin')) {
      // upgrade StoremanGroupProxy
      contract = await scTool.getDeployedContract('StoremanGroupProxy', smgProxyAddress);
      txData = await contract.methods.upgradeTo(smgDelegateAddress).encodeABI();
      serialized = await scTool.serializeTx(txData, nonce++, smgProxyAddress, '0', walletId, path);
      output.push({name: 'setStoremanGroupAdminImp', data: serialized});
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