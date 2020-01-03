const p = require('path');
const cfg = require('../config.json');
const tool = require('../utils/tool');
const scTool = require('../utils/scTool');
const contractAddress = require('../contractAddress');

const txDataDir = tool.getOutputPath('txData');

async function buildDependency(walletId, path) {
  let contract, txData;

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
  await scTool.serializeTx(txData, nonce++, tmProxyAddress, '0', p.join(txDataDir, "setTokenManagerImp.dat"), walletId, path);
  contract = await scTool.getDeployedContract('TokenManagerDelegate', tmProxyAddress);
  txData = await contract.methods.setHtlcAddr(htlcProxyAddress).encodeABI();
  await scTool.serializeTx(txData, nonce++, tmProxyAddress, '0', p.join(txDataDir, "setTokenManagerHtlc.dat"), walletId, path);

  /* 
   * build htlc dependency
   */

   // HTLCProxy
   contract = await scTool.getDeployedContract('HTLCProxy', htlcProxyAddress);
   txData = await contract.methods.upgradeTo(htlcDelegateAddress).encodeABI();
   await scTool.serializeTx(txData, nonce++, htlcProxyAddress, '0', p.join(txDataDir, "setHTLCImp.dat"), walletId, path);
   contract = await scTool.getDeployedContract('HTLCDelegate', htlcProxyAddress);
   txData = await contract.methods.setEconomics(tmProxyAddress, smgProxyAddress, cfg.htlcRatio).encodeABI();
   await scTool.serializeTx(txData, nonce++, htlcProxyAddress, '0', p.join(txDataDir, "setHTLCEconomics.dat"), walletId, path);

  /*
   *  build StoremanGroupAdmin dependency
   */

  // StoremanGroupProxy
  contract = await scTool.getDeployedContract('StoremanGroupProxy', smgProxyAddress);
  txData = await contract.methods.upgradeTo(smgDelegateAddress).encodeABI();
  await scTool.serializeTx(txData, nonce++, smgProxyAddress, '0', p.join(txDataDir, "setStoremanGroupAdminImp.dat"), walletId, path);
  contract = await scTool.getDeployedContract('StoremanGroupDelegate', smgProxyAddress);
  txData = await contract.methods.setDependence(tmProxyAddress, htlcProxyAddress).encodeABI();
  await scTool.serializeTx(txData, nonce++, smgProxyAddress, '0', p.join(txDataDir, "setStoremanGroupAdminDependency.dat"), walletId, path);

  // update nonce
  tool.updateNonce(sender, nonce);
}

module.exports = buildDependency;