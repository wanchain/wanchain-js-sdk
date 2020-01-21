const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

async function buildUpdateHtlcEconomics(walletId, path, revokeFeeRatio) {
  let contract, txData, serialized, output = [];

  try {
    let sender = await scTool.path2Address(walletId, path);
    let nonce = tool.getNonce(sender);

    let tmProxyAddress = tool.getAddress('contract', 'TokenManagerProxy');
    let htlcProxyAddress = tool.getAddress('contract', 'HTLCProxy');
    let smgProxyAddress = tool.getAddress('contract', 'StoremanGroupProxy')
  
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
    tool.logger.error("build UpdateHtlcEconomics failed: %O", e);
    return false;
  }
}

async function buildStoremanGroupUnregister(walletId, path, tokenOrigAccount, storemanGroup) {
  let contract, txData, serialized, output = [];

  try {
    let sender = await scTool.path2Address(walletId, path);
    let nonce = tool.getNonce(sender);

    let smgProxyAddress = tool.getAddress('contract', 'StoremanGroupProxy');

    // StoremanGroupProxy
    contract = await scTool.getDeployedContract('StoremanGroupDelegate', smgProxyAddress);
    txData = await contract.methods.storemanGroupUnregister(tokenOrigAccount, storemanGroup).encodeABI();
    serialized = await scTool.serializeTx(txData, nonce++, smgProxyAddress, '0', walletId, path);
    output.push({name: 'storemanGroupUnregister', data: serialized});

    let filePath = tool.getOutputPath('update');
    tool.write2file(filePath, JSON.stringify(output));
    tool.logger.info("tx is serialized to %s", filePath);

    // update nonce
    tool.updateNonce(sender, nonce);

    return true;
  } catch (e) {
    tool.logger.error("build StoremanGroupUnregister failed: %O", e);
    return false;
  }
}

async function buildStoremanGroupWithdrawDeposit(walletId, path, tokenOrigAccount, storemanGroup) {
  let contract, txData, serialized, output = [];

  try {
    let sender = await scTool.path2Address(walletId, path);
    let nonce = tool.getNonce(sender);

    let smgProxyAddress = tool.getAddress('contract', 'StoremanGroupProxy');

    // StoremanGroupProxy
    contract = await scTool.getDeployedContract('StoremanGroupDelegate', smgProxyAddress);
    txData = await contract.methods.storemanGroupWithdrawDeposit(tokenOrigAccount, storemanGroup).encodeABI();
    serialized = await scTool.serializeTx(txData, nonce++, smgProxyAddress, '0', walletId, path);
    output.push({name: 'storemanGroupWithdrawDeposit', data: serialized});

    let filePath = tool.getOutputPath('update');
    tool.write2file(filePath, JSON.stringify(output));
    tool.logger.info("tx is serialized to %s", filePath);

    // update nonce
    tool.updateNonce(sender, nonce);

    return true;
  } catch (e) {
    tool.logger.error("build StoremanGroupWithdrawDeposit failed: %O", e);
    return false;
  }
}

module.exports = {
  buildUpdateHtlcEconomics,
  buildStoremanGroupUnregister,
  buildStoremanGroupWithdrawDeposit
};