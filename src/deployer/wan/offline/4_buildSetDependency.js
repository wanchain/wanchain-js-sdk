const cfg = require('../config.json');
const tool = require('../utils/tool');
const scTool = require('../utils/scTool');
const contractAddress = require('../contractAddress');

async function buildDependency(walletId, path) {
  let contract, txData, serialized, output = [];

  try {
    let sender = await scTool.path2Address(walletId, path);
    let nonce = tool.getNonce(sender);

    let tmProxyAddress = contractAddress.getAddress('TokenManagerProxy');
    let tmDelegateAddress = contractAddress.getAddress('TokenManagerDelegate');
    let htlcProxyAddress = contractAddress.getAddress('HTLCProxy');
    let htlcDelegateAddress = contractAddress.getAddress('HTLCDelegate');
    let smgProxyAddress = contractAddress.getAddress('StoremanGroupProxy')
    let smgDelegateAddress = contractAddress.getAddress('StoremanGroupDelegate');
  
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
    txData = await contract.methods.setEconomics(tmProxyAddress, smgProxyAddress, cfg.htlcRatio).encodeABI();
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
    console.log("tx is serialized to %s", filePath);

    // update nonce
    tool.updateNonce(sender, nonce);

    return true;
  } catch (e) {
    console.error("buildDependency failed: %O", e);
    return false;
  }
}

module.exports = buildDependency;