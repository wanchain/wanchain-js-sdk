const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

async function buildUpgradeContract(walletId, path) {
  let compiled, txData, serialized, output = [];

  let components = global.deployerContext.upgradeComponents;
  if ((!components) || (components.length == 0)) {
    tool.logger.error("upgrade components are not set");
    return false;
  }

  try {
    let sender = await scTool.path2Address(walletId, path);
    let nonce = tool.getNonce(sender);
   
    if (components.includes('tokenManager')) {
      // upgrade TokenManagerDelegate
      compiled = scTool.compileContract('TokenManagerDelegate');
      txData = await scTool.getDeployContractTxData(compiled);
      serialized = await scTool.serializeTx(txData, nonce++, '', '0', walletId, path);
      output.push({name: 'TokenManagerDelegate', data: serialized});
    }

    if (components.includes('lib') || components.includes('htlc')) {
      // upgrade HTLCDelegate
      compiled = scTool.compileContract('HTLCDelegate');
      scTool.linkContract(compiled, ['SchnorrVerifier', 'QuotaLib', 'HTLCLib', 'HTLCDebtLib', 'HTLCSmgLib', 'HTLCUserLib']);
      txData = await scTool.getDeployContractTxData(compiled);
      serialized = await scTool.serializeTx(txData, nonce++, '', '0', walletId, path);
      output.push({name: 'HTLCDelegate', data: serialized});
    }

    if (components.includes('StoremanGroupAdmin')) {
      // upgrade StoremanGroupDelegate
      compiled = scTool.compileContract('StoremanGroupDelegate');
      txData = await scTool.getDeployContractTxData(compiled);
      serialized = await scTool.serializeTx(txData, nonce++, '', '0', walletId, path);
      output.push({name: 'StoremanGroupDelegate', data: serialized.toString('hex')});
    }

    let filePath = tool.getOutputPath('upgradeContract');
    tool.write2file(filePath, JSON.stringify(output));
    tool.logger.info("tx is serialized to %s", filePath);

    // update nonce
    tool.updateNonce(sender, nonce);

    return true;
  } catch (e) {
    tool.logger.error("buildUpgradeContract failed: %O", e);
    return false;
  }
}

module.exports = buildUpgradeContract;