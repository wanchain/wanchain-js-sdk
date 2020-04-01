const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

async function buildRelayerDelegate(walletId, path, params) {
  let compiled, txData, serialized, output = [];

  try {
    let sender = await scTool.path2Address(walletId, path);
    let nonce = tool.getNonce(sender);

    let dataPath = tool.getInputPath('delegate_address');  //get delegate addr
    let data = JSON.parse(tool.readFromFile(dataPath));

    let delegateAddr = data[0][1];

    dataPath = tool.getInputPath('buildProxyConfig');       //get exchange sc addr
    let exchangeSC = JSON.parse(tool.readFromFile(dataPath));

    let exchangeAddr = exchangeSC[0][1];

    // Proxy white list add
    contract = await scTool.getDeployedContract('HybridExchange', exchangeAddr);
    txData = await contract.methods.approveDelegate(delegateAddr).encodeABI();
    serialized = await scTool.serializeTx(txData, nonce++, exchangeAddr, '0', walletId, path);
    output.push({name: 'BuildApproveDelegate', data: serialized});

    let filePath = tool.getOutputPath('buildRelayerDelegate');
    tool.write2file(filePath, JSON.stringify(output));
    tool.logger.info("tx is serialized to %s", filePath);

    // update nonce
    tool.updateNonce(sender, nonce);
    return true;
  } catch (e) {
    tool.logger.error("buildRelayerDelegate failed: %O", e);
    return false;
  }
}

module.exports = buildRelayerDelegate;