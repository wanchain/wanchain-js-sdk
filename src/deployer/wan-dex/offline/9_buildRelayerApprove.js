const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

async function buildRelayerApprove(walletId, path, params) {
  let compiled, txData, serialized, output = [];

  try {
    let sender = await scTool.path2Address(walletId, path);
    let nonce = tool.getNonce(sender);

    let dataPath = tool.getInputPath('buildExchangeContract');  //get pre-sc addr
    let preSC = JSON.parse(tool.readFromFile(dataPath));

    let proxyAddr = preSC[0][1];
    let wwanAddr = preSC[1][1];
    let wwanName = preSC[1][0];

    dataPath = tool.getInputPath('token_address');       //get exchange sc addr
    let tokens = JSON.parse(tool.readFromFile(dataPath));
    tokens.push([wwanName, wwanAddr]);

    for (let i=0; i<tokens.length; i++) {
      contract = await scTool.getDeployedContract('TestToken', tokens[i][1]);
      txData = await contract.methods.approve(proxyAddr, "100000000000000000000000000").encodeABI();
      serialized = await scTool.serializeTx(txData, nonce++, proxyAddr, '0', walletId, path);
      output.push({name: tokens[i][0] + '_Approve', data: serialized});
    }

    let filePath = tool.getOutputPath('buildRelayerApprove');
    tool.write2file(filePath, JSON.stringify(output));
    tool.logger.info("tx is serialized to %s", filePath);

    // update nonce
    tool.updateNonce(sender, nonce);

    return true;
  } catch (e) {
    tool.logger.error("buildRelayerApprove failed: %O", e);
    return false;
  }
}

module.exports = buildRelayerApprove;