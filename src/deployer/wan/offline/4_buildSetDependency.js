const cfg = require('../config.json');
const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

async function buildDependency(walletId, path) {
  let contract, txData, serialized, output = [];

  try {
    let sender = await scTool.path2Address(walletId, path);
    let nonce = tool.getNonce(sender);

    let tmProxyAddress = tool.getAddress('contract', 'TokenManagerProxy');
    let tmDelegateAddress = tool.getAddress('contract', 'TokenManagerDelegate');
    let htlcProxyAddress = tool.getAddress('contract', 'HTLCProxy');
    let htlcDelegateAddress = tool.getAddress('contract', 'HTLCDelegate');
    let smgProxyAddress = tool.getAddress('contract', 'StoremanGroupProxy')
    let smgDelegateAddress = tool.getAddress('contract', 'StoremanGroupDelegate');
  
    /* 
    * build TokenManager dependency
    */

    // TokenManagerProxy
    contract = await scTool.getDeployedContract('TokenManagerProxy', tmProxyAddress);
    txData = await contract.methods.upgradeTo(tmDelegateAddress).encodeABI();
    serialized = await scTool.serializeTx(txData, nonce++, tmProxyAddress, '0', walletId, path);
    output.push({name: 'setTokenManagerImp', data: serialized});
    contract = await scTool.getDeployedContract('TokenManagerDelegate', tmProxyAddress);
    txData = await contract.methods.setHtlcAddr(htlcProxyAddress).encodeABI();
    serialized = await scTool.serializeTx(txData, nonce++, tmProxyAddress, '0', walletId, path);
    output.push({name: 'setTokenManagerHtlc', data: serialized});

    /* 
    * build htlc dependency
    */

    // HTLCProxy
    contract = await scTool.getDeployedContract('HTLCProxy', htlcProxyAddress);
    txData = await contract.methods.upgradeTo(htlcDelegateAddress).encodeABI();
    serialized = await scTool.serializeTx(txData, nonce++, htlcProxyAddress, '0', walletId, path);
    output.push({name: 'setHTLCImp', data: serialized});
    contract = await scTool.getDeployedContract('HTLCDelegate', htlcProxyAddress);
    txData = await contract.methods.setEconomics(tmProxyAddress, smgProxyAddress, cfg.revokeFeeRatio).encodeABI();
    serialized = await scTool.serializeTx(txData, nonce++, htlcProxyAddress, '0', walletId, path);
    output.push({name: 'setHTLCEconomics', data: serialized});

    /*
    *  build StoremanGroupAdmin dependency
    */

    // StoremanGroupProxy
    contract = await scTool.getDeployedContract('StoremanGroupProxy', smgProxyAddress);
    txData = await contract.methods.upgradeTo(smgDelegateAddress).encodeABI();
    serialized = await scTool.serializeTx(txData, nonce++, smgProxyAddress, '0', walletId, path);
    output.push({name: 'setStoremanGroupAdminImp', data: serialized});
    contract = await scTool.getDeployedContract('StoremanGroupDelegate', smgProxyAddress);
    txData = await contract.methods.setDependence(tmProxyAddress, htlcProxyAddress).encodeABI();
    serialized = await scTool.serializeTx(txData, nonce++, smgProxyAddress, '0', walletId, path);
    output.push({name: 'setStoremanGroupAdminDependency', data: serialized});

    let filePath = tool.getOutputPath('setDependency');
    tool.write2file(filePath, JSON.stringify(output));
    tool.logger.info("tx is serialized to %s", filePath);

    // update nonce
    tool.updateNonce(sender, nonce);

    return true;
  } catch (e) {
    tool.logger.error("buildDependency failed: %O", e);
    return false;
  }
}

module.exports = buildDependency;