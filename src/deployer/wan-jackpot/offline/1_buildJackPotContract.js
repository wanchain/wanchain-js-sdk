const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

async function buildJackPotContract(walletId, path) {
  let compiled, txData, serialized, output = [];

  try {
    let sender = await scTool.path2Address(walletId, path);
    let nonce = tool.getNonce(sender);

    // JacksPotDelegate
    compiled = scTool.compileContract('JacksPotDelegate');
    txData = await scTool.getDeployContractTxData(compiled);
    serialized = await scTool.serializeTx(txData, nonce++, '', '0', walletId, path);
    output.push({name: 'JacksPotDelegate', data: serialized});

    // JacksPotProxy
    compiled = scTool.compileContract('JacksPotProxy');
    txData = await scTool.getDeployContractTxData(compiled);
    serialized = await scTool.serializeTx(txData, nonce++, '', '0', walletId, path);
    output.push({name: 'JacksPotProxy', data: serialized});

    let filePath = tool.getOutputPath('buildJackPotContract');
    tool.write2file(filePath, JSON.stringify(output));
    tool.logger.info("tx is serialized to %s", filePath);

    // update nonce
    tool.updateNonce(sender, nonce);

    return true;
  } catch (e) {
    tool.logger.error("buildJackPotContract failed: %O", e);
    return false;
  }
}

module.exports = buildJackPotContract;