const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

async function buildExchangeContract(walletId, path, params) {
  let compiled, txData, serialized, output = [];

  try {
    let sender = await scTool.path2Address(walletId, path);
    let nonce = tool.getNonce(sender);

    let dataPath = tool.getInputPath('buildExchangeContract');
    let data = JSON.parse(tool.readFromFile(dataPath));

    // HybridExchange
    compiled = scTool.compileContract('HybridExchange');
    txData = await scTool.getDeployContractTxDataWithParams(compiled, [data[0][1], data[2][1]]);
    serialized = await scTool.serializeTx(txData, nonce++, '', '0', walletId, path);
    output.push({name: 'HybridExchange', data: serialized});

    let filePath = tool.getOutputPath('buildExchangeContract');
    tool.write2file(filePath, JSON.stringify(output));
    tool.logger.info("tx is serialized to %s", filePath);

    // update nonce
    tool.updateNonce(sender, nonce);

    return true;
  } catch (e) {
    tool.logger.error("buildExchangeContract failed: %O", e);
    return false;
  }
}

module.exports = buildExchangeContract;