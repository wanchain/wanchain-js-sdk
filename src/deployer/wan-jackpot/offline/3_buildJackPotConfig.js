const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

async function buildJackPotConfig(walletId, path, params) {
  let contract, txData, serialized, output = [];

  try {
    let sender = await scTool.path2Address(walletId, path);
    let nonce = tool.getNonce(sender);


    let dataPath = tool.getInputPath('buildJackPotConfig');  //get sc addr
    let preSC = JSON.parse(tool.readFromFile(dataPath));

    let delegateAddr = preSC[0][1];
    let proxyAddr = preSC[1][1];


    dataPath = tool.getInputPath('jackpotConfig');       //get config info
    let configs = JSON.parse(tool.readFromFile(dataPath));

    // Upgrade Proxy's implement addr
    contract = await scTool.getDeployedContract('JacksPotProxy', proxyAddr);
    txData = await contract.methods.upgradeTo(delegateAddr).encodeABI();
    serialized = await scTool.serializeTx(txData, nonce++, proxyAddr, '0', walletId, path);
    output.push({ name: 'upgradeTo', data: serialized });

    // Init sc proxy address with delegate methods
    contract = await scTool.getDeployedContract('JacksPotDelegate', proxyAddr);
    txData = await contract.methods.init().encodeABI();
    serialized = await scTool.serializeTx(txData, nonce++, proxyAddr, '0', walletId, path);
    output.push({ name: 'init', data: serialized });

    for (let i = 0; i < configs.length; i++) {
      switch (configs[i][0]) {
        case "setOperator":
          txData = await contract.methods.setOperator(configs[i][1]).encodeABI();
          serialized = await scTool.serializeTx(txData, nonce++, proxyAddr, '0', walletId, path);
          output.push({ name: 'setOperator', data: serialized });
          break;
        case "setFeeRate":
          txData = await contract.methods.setFeeRate(configs[i][1]).encodeABI();
          serialized = await scTool.serializeTx(txData, nonce++, proxyAddr, '0', walletId, path);
          output.push({ name: 'setFeeRate', data: serialized });
          break;
        case "setDelegatePercent":
          txData = await contract.methods.setDelegatePercent(configs[i][1]).encodeABI();
          serialized = await scTool.serializeTx(txData, nonce++, proxyAddr, '0', walletId, path);
          output.push({ name: 'setDelegatePercent', data: serialized });
          break;
        case "setMaxDigital":
          txData = await contract.methods.setMaxDigital(configs[i][1]).encodeABI();
          serialized = await scTool.serializeTx(txData, nonce++, proxyAddr, '0', walletId, path);
          output.push({ name: 'setMaxDigital', data: serialized });
          break;
        case "config":
          txData = await contract.methods.config(
            configs[i][1].maxCount,
            scTool.wan2win(configs[i][1].minAmount),
            configs[i][1].minGasLeft,
            scTool.wan2win(configs[i][1].firstDelegateMinValue)
          ).encodeABI();
          serialized = await scTool.serializeTx(txData, nonce++, proxyAddr, '0', walletId, path);
          output.push({ name: 'config', data: serialized });
          break;
        case "buy":
          txData = await contract.methods.buy([0], [scTool.wan2win(configs[i][1])]).encodeABI();
          serialized = await scTool.serializeTx(txData, nonce++, proxyAddr, scTool.wan2win(configs[i][1]), walletId, path);
          break;
        default:
          tool.logger.error("buildJackPotConfig unknown section: %0", configs[i][0]);
          break;
      }
    }

    let filePath = tool.getOutputPath('buildJackPotConfig');
    tool.write2file(filePath, JSON.stringify(output));
    tool.logger.info("tx is serialized to %s", filePath);

    // update nonce
    tool.updateNonce(sender, nonce);

    return true;
  } catch (e) {
    tool.logger.error("buildJackPotConfig failed: %O", e);
    return false;
  }
}

module.exports = buildJackPotConfig;
