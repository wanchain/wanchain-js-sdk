const p = require('path');
const tool = require('../utils/tool');
const scTool = require('../utils/scTool');
const contractAddress = require('../contractAddress');

const smgPath = tool.getInputPath('smg');
const txDataDir = tool.getOutputPath('txData');

const smgArray = require(smgPath);

async function buildRegisterSmg(walletId, path) {
  let contract, txData, i;

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