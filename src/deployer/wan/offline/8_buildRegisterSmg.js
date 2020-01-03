const p = require('path');
const tool = require('../utils/tool');
const scTool = require('../utils/scTool');
const contractAddress = require('../contractAddress');

async function buildRegisterSmg(walletId, path) {
  let contract, txData, i;
  
  let smgPath = tool.getInputPath('smg');
  let txDataDir = tool.getOutputPath('txDataDir');  
  let smgArray = require(smgPath);  

  let sender = await scTool.path2Address(walletId, path);
  let nonce = tool.getNonce(sender);

  let smgProxyAddress = contractAddress.getAddress('StoremanGroupProxy');
  contract = await scTool.getDeployedContract('StoremanGroupDelegate', smgProxyAddress);

  for (i = 0; i < smgArray.length; i++) {
    let s = smgArray[i];
    txData = await contract.methods.storemanGroupRegister(s.tokenOrigAccount, s.storemanGroup, s.txFeeRatio).encodeABI();
    await scTool.serializeTx(txData, nonce++, smgProxyAddress, s.wanDeposit.toString(), p.join(txDataDir, "registerSmg" + s.tokenSymbol + ".dat"), walletId, path);
  }

  // update nonce
  tool.updateNonce(sender, nonce);
}

module.exports = buildRegisterSmg;