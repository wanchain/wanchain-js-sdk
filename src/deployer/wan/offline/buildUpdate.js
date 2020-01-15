const tool = require('../utils/tool');
const scTool = require('../utils/scTool');
const contractAddress = require('../contractAddress');

async function buildUpdateHtlcEconomics(walletId, path, revokeFeeRatio) {
  let contract, txData, serialized, output = [];

  try {
    let sender = await scTool.path2Address(walletId, path);
    let nonce = tool.getNonce(sender);

    let tmProxyAddress = contractAddress.getAddress('TokenManagerProxy');
    let htlcProxyAddress = contractAddress.getAddress('HTLCProxy');
    let smgProxyAddress = contractAddress.getAddress('StoremanGroupProxy')
  
    /* 
    * build htlc dependency
    */

    // HTLCProxy
    contract = await scTool.getDeployedContract('HTLCDelegate', htlcProxyAddress);
    txData = await contract.methods.setEconomics(tmProxyAddress, smgProxyAddress, revokeFeeRatio).encodeABI();
    serialized = await scTool.serializeTx(txData, nonce++, htlcProxyAddress, '0', walletId, path);
    output.push({name: 'updateHTLCEconomics', data: serialized});

    let filePath = tool.getOutputPath('update');
    tool.write2file(filePath, JSON.stringify(output));
    tool.logger.info("tx is serialized to %s", filePath);

    // update nonce
    tool.updateNonce(sender, nonce);

    return true;
  } catch (e) {
    tool.logger.error("build update failed: %O", e);
    return false;
  }
}

module.exports = {
  buildUpdateHtlcEconomics
};