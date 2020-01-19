const tool = require('../utils/tool');
const scTool = require('../utils/scTool');
const contractAddress = require('../contractAddress');

async function build(data, index, walletId, path, contract, output) {
  if (index >= data.length) {
    // tool.logger.info("buildRegisterSmg finished");
    return true;
  }
  let s = data[index];
  let sender = await scTool.path2Address(walletId, path);
  let nonce = tool.getNonce(sender);
  let txData = await contract.methods.storemanGroupRegister(s.tokenOrigAccount, s.storemanGroup, s.txFeeRatio).encodeABI();
  let serialized = await scTool.serializeTx(txData, nonce++, contract.options.address, s.wanDeposit.toString(), walletId, path);
  output.push({token: s.tokenSymbol, smg: s.storemanGroup, data: serialized});
  // update nonce
  tool.updateNonce(sender, nonce);
  return await build(data, index + 1, walletId, path, contract, output);
}

async function buildRegisterSmg(walletId, path) {
  let contract, txData, i, serialized, output = [];
  
  try {
    let smgPath = tool.getInputPath('smg');
    let smgArray = require(smgPath);  

    let smgProxyAddress = contractAddress.getAddress('StoremanGroupProxy');
    contract = await scTool.getDeployedContract('StoremanGroupDelegate', smgProxyAddress);

    await build(smgArray, 0, walletId, path, contract, output);

    let filePath = tool.getOutputPath('registerSmg');
    tool.write2file(filePath, JSON.stringify(output));
    tool.logger.info("tx is serialized to %s", filePath);

    return true;
  } catch (e) {
    tool.logger.error("buildRegisterSmg failed: %O", e);
    return false;    
  }
}

module.exports = buildRegisterSmg;