const p = require('path');
const tool = require('../utils/tool');
const scTool = require('../utils/scTool');
const contractAddress = require('../contractAddress');

const tokenPath = tool.getInputPath('token');
const txDataDir = tool.getOutputPath('txData');

const tokenArray = require(tokenPath);

async function buildRegisterToken(walletId, path) {
  let contract, txData, i;

  let sender = await scTool.path2Address(walletId, path);
  let nonce = tool.getNonce(sender);

  let tmProxyAddress = contractAddress.getAddress('TokenManagerProxy');
  contract = await scTool.getDeployedContract('TokenManagerDelegate', tmProxyAddress);
  
  for (i = 0; i < tokenArray.length; i++) {
    let t = tokenArray[i];
    txData = await contract.methods.addToken(t.tokenOrigAccount, t.token2WanRatio, scTool.wan2win(t.minDeposit), t.withdrawDelayTime,
                                      tool.str2hex(t.name), tool.str2hex(t.symbol), t.decimals)
                                   .encodeABI();
    await await scTool.serializeTx(txData, nonce++, tmProxyAddress, '0', p.join(txDataDir, "registerToken" + t.symbol + ".dat"), walletId, path);
  }

  // update nonce
  tool.updateNonce(sender, nonce);
}

module.exports = buildRegisterToken;