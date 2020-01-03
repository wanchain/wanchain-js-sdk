const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

async function buildDeployContract(walletId, path) {
  let compiled, txData, serialized, output = [];

  let sender = await scTool.path2Address(walletId, path);
  let nonce = tool.getNonce(sender);

  /* 
   * build TokenManager contracts
   */

  // TokenManagerProxy
  compiled = scTool.compileContract('TokenManagerProxy');
  txData = await scTool.getDeployContractTxData(compiled);
  serialized = await scTool.serializeTx(txData, nonce++, '', '0', walletId, path);
  output.push({name: 'TokenManagerProxy', data: serialized});

  // TokenManagerDelegate
  compiled = scTool.compileContract('TokenManagerDelegate');
  txData = await scTool.getDeployContractTxData(compiled);
  serialized = await scTool.serializeTx(txData, nonce++, '', '0', walletId, path);
  output.push({name: 'TokenManagerDelegate', data: serialized});
  
  /* 
   * build htlc contracts
   */

   // HTLCProxy
   compiled = scTool.compileContract('HTLCProxy');
   txData = await scTool.getDeployContractTxData(compiled);
   serialized = await scTool.serializeTx(txData, nonce++, '', '0', walletId, path);
   output.push({name: 'HTLCProxy', data: serialized});

   // HTLCDelegate
   compiled = scTool.compileContract('HTLCDelegate');
   scTool.linkContract(compiled, ['SchnorrVerifier', 'QuotaLib', 'HTLCLib', 'HTLCDebtLib', 'HTLCSmgLib', 'HTLCUserLib']);
   txData = await scTool.getDeployContractTxData(compiled);
   serialized = await scTool.serializeTx(txData, nonce++, '', '0', walletId, path);
   output.push({name: 'HTLCDelegate', data: serialized});  

  /*
   *  build StoremanGroupAdmin contracts
   */

  // StoremanGroupProxy
  compiled = scTool.compileContract('StoremanGroupProxy');
  txData = await scTool.getDeployContractTxData(compiled);
  serialized = await scTool.serializeTx(txData, nonce++, '', '0', walletId, path);
  output.push({name: 'StoremanGroupProxy', data: serialized.toString('hex')});

  // StoremanGroupDelegate
  compiled = scTool.compileContract('StoremanGroupDelegate');
  txData = await scTool.getDeployContractTxData(compiled);
  serialized = await scTool.serializeTx(txData, nonce++, '', '0', walletId, path);
  output.push({name: 'StoremanGroupDelegate', data: serialized.toString('hex')});

  let filePath = tool.getOutputPath('deployContract');
  tool.write2file(filePath, JSON.stringify(output));
  console.log("tx is serialized to %s", filePath);

  // update nonce
  tool.updateNonce(sender, nonce);
}

module.exports = buildDeployContract;