const tool = require('../utils/tool');
const scTool = require('../utils/scTool');
const contractAddress = require('../contractAddress');

async function build(data, index, walletId, path, contract, output) {
  if (index >= data.length) {
    // tool.logger.info("buildRegisterToken finished");
    return true;
  }
  let t = data[index];
  let sender = await scTool.path2Address(walletId, path);
  let nonce = tool.getNonce(sender);
  let withdrawDelayTime = t.withdrawDelayHours * 3600;
  let txData = await contract.methods.addToken(t.tokenOrigAccount, t.token2WanRatio, scTool.wan2win(t.minDeposit), withdrawDelayTime,
                                        tool.str2hex(t.name), tool.str2hex(t.symbol), t.decimals)
                                     .encodeABI();
  let serialized = await scTool.serializeTx(txData, nonce++, contract.options.address, '0', walletId, path);
  output.push({symbol: t.symbol, data: serialized});
  // update nonce
  tool.updateNonce(sender, nonce);
  return await build(data, index + 1, walletId, path, contract, output);
}

async function buildRegisterToken(walletId, path) {
  let contract, output = [];

  try {
    let tokenPath = tool.getInputPath('token');
    let tokenArray = require(tokenPath);

    let tmProxyAddress = contractAddress.getAddress('TokenManagerProxy');
    contract = await scTool.getDeployedContract('TokenManagerDelegate', tmProxyAddress);
    
    await build(tokenArray, 0, walletId, path, contract, output);

    let filePath = tool.getOutputPath('registerToken');
    tool.write2file(filePath, JSON.stringify(output));
    tool.logger.info("tx is serialized to %s", filePath);

    return true;
  } catch (e) {
    tool.logger.error("buildRegisterToken failed: %O", e);
    return false;
  }
}

module.exports = buildRegisterToken;