const p = require('path');
const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

const txDataDir = tool.getOutputPath('txData');

async function buildDeployContract(walletId, path) {
  let compiled, txData;

  let sender = await scTool.path2Address(walletId, path);
  let nonce = tool.getNonce(sender);
  console.log("tool.getNonce %s, %d", sender, nonce)

  /* 
   * build TokenManager contracts
   */

  // TokenManagerProxy
  compiled = scTool.compileContract('TokenManagerProxy');
  txData = await scTool.getDeployContractTxData(compiled);
  await scTool.serializeTx(txData, nonce++, '', '0', p.join(txDataDir, "deployTokenManagerProxy.dat"), walletId, path);

  // TokenManagerDelegate
  compiled = scTool.compileContract('TokenManagerDelegate');
  txData = await scTool.getDeployContractTxData(compiled);
  await scTool.serializeTx(txData, nonce++, '', '0', p.join(txDataDir, "deployTokenManagerDelegate.dat"), walletId, path);
  
  /* 
   * build htlc contracts
   */

   // HTLCProxy
   compiled = scTool.compileContract('HTLCProxy');
   txData = await scTool.getDeployContractTxData(compiled);
   await scTool.serializeTx(txData, nonce++, '', '0', p.join(txDataDir, "deployHTLCProxy.dat"), walletId, path);

   // HTLCDelegate
   compiled = scTool.compileContract('HTLCDelegate');
   scTool.linkContract(compiled, ['SchnorrVerifier', 'QuotaLib', 'HTLCLib', 'HTLCDebtLib', 'HTLCSmgLib', 'HTLCUserLib']);
   txData = await scTool.getDeployContractTxData(compiled);
   await scTool.serializeTx(txData, nonce++, '', '0', p.join(txDataDir, "deployHTLCDelegate.dat"), walletId, path);
  

  /*
   *  build StoremanGroupAdmin contracts
   */

  // StoremanGroupProxy
  compiled = scTool.compileContract('StoremanGroupProxy');
  txData = await scTool.getDeployContractTxData(compiled);
  await scTool.serializeTx(txData, nonce++, '', '0', p.join(txDataDir, "deployStoremanGroupProxy.dat"), walletId, path);

  // StoremanGroupDelegate
  compiled = scTool.compileContract('StoremanGroupDelegate');
  txData = await scTool.getDeployContractTxData(compiled);
  await scTool.serializeTx(txData, nonce++, '', '0', p.join(txDataDir, "deployStoremanGroupDelegate.dat"), walletId, path);  

  // update nonce
  tool.updateNonce(sender, nonce);
}

module.exports = buildDeployContract;