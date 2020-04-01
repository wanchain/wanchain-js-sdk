const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

async function buildProxyConfig(walletId, path) {
  let compiled, txData, serialized, output = [];

  try {
    let sender = await scTool.path2Address(walletId, path);
    let nonce = tool.getNonce(sender);

    let dataPath = tool.getInputPath('buildExchangeContract');  //get pre-sc addr
    let preSC = JSON.parse(tool.readFromFile(dataPath));

    let proxyAddr = preSC[0][1];

    dataPath = tool.getInputPath('buildProxyConfig');       //get exchange sc addr
    let exchangeSC = JSON.parse(tool.readFromFile(dataPath));

    let exchangeAddr = exchangeSC[0][1];

    // Proxy white list add
    contract = await scTool.getDeployedContract('Proxy', proxyAddr);
    txData = await contract.methods.addAddress(exchangeAddr).encodeABI();
    serialized = await scTool.serializeTx(txData, nonce++, proxyAddr, '0', walletId, path);
    output.push({name: 'ProxyWhiteList', data: serialized});

    // Proxy renounceOwnership
    txData = await contract.methods.renounceOwnership().encodeABI();
    serialized = await scTool.serializeTx(txData, nonce++, proxyAddr, '0', walletId, path);
    output.push({name: 'ProxyRenounceOwnership', data: serialized});

    let filePath = tool.getOutputPath('buildProxyConfig');
    tool.write2file(filePath, JSON.stringify(output));
    tool.logger.info("tx is serialized to %s", filePath);

    // update nonce
    tool.updateNonce(sender, nonce);

    return true;
  } catch (e) {
    tool.logger.error("buildProxyConfig failed: %O", e);
    return false;
  }
}

module.exports = buildProxyConfig;