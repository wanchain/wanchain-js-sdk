const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

async function buildPrepareContract(walletId, path) {
  let compiled, txData, serialized, output = [];

  try {
    let sender = await scTool.path2Address(walletId, path);
    let nonce = tool.getNonce(sender);

    // Proxy
    compiled = scTool.compileContract('Proxy');
    txData = await scTool.getDeployContractTxData(compiled);
    serialized = await scTool.serializeTx(txData, nonce++, '', '0', walletId, path);
    output.push({name: 'Proxy', data: serialized});

    // WwanToken
    compiled = scTool.compileContract('WwanToken');
    txData = await scTool.getDeployContractTxData(compiled);
    serialized = await scTool.serializeTx(txData, nonce++, '', '0', walletId, path);
    output.push({name: 'WwanToken', data: serialized});
    console.log()
    // TestToken
    compiled = scTool.compileContract('TestToken');
    txData = await scTool.getDeployContractTxDataWithParams(compiled, ["Discount Coins in Wanchain", "DCW", 18]);
    serialized = await scTool.serializeTx(txData, nonce++, '', '0', walletId, path);
    output.push({name: 'TestToken', data: serialized});

    let filePath = tool.getOutputPath('buildPrepareContract');
    tool.write2file(filePath, JSON.stringify(output));
    tool.logger.info("tx is serialized to %s", filePath);

    // update nonce
    tool.updateNonce(sender, nonce);

    return true;
  } catch (e) {
    tool.logger.error("buildPrepareContract failed: %O", e);
    return false;
  }
}

module.exports = buildPrepareContract;