const tool = require('../utils/tool');
const scTool = require('../utils/scTool');
const contractAddress = require('../contractAddress');

async function buildRegisterSmg(walletId, path) {
  let contract, txData, i, serialized, output = [];
  
  try {
    let smgPath = tool.getInputPath('smg');
    let smgArray = require(smgPath);  

    let sender = await scTool.path2Address(walletId, path);
    let nonce = tool.getNonce(sender);

    let smgProxyAddress = contractAddress.getAddress('StoremanGroupProxy');
    contract = await scTool.getDeployedContract('StoremanGroupDelegate', smgProxyAddress);

    for (i = 0; i < smgArray.length; i++) {
      let s = smgArray[i];
      txData = await contract.methods.storemanGroupRegister(s.tokenOrigAccount, s.storemanGroup, s.txFeeRatio).encodeABI();
      serialized = await scTool.serializeTx(txData, nonce++, smgProxyAddress, s.wanDeposit.toString(), walletId, path);
      output.push({token: s.tokenSymbol, smg: s.storemanGroup, data: serialized});
    }

    let filePath = tool.getOutputPath('registerSmg');
    tool.write2file(filePath, JSON.stringify(output));
    console.log("tx is serialized to %s", filePath);

    // update nonce
    tool.updateNonce(sender, nonce);

    return true;
  } catch (e) {
    console.error("buildRegisterSmg failed: %O", e);
    return false;    
  }
}

module.exports = buildRegisterSmg;