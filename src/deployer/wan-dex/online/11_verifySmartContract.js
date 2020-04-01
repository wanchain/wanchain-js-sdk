const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

async function verifySmartContract() {
  try {
    let dataPath = tool.getInputPath('buildExchangeContract');  //get pre-sc addr
    let preSC = JSON.parse(tool.readFromFile(dataPath));

    let proxyAddr = preSC[0][1];
    let wwanAddr = preSC[1][1];
    let wwanName = 'WWAN';

    dataPath = tool.getInputPath('token_address');       //get tokens sc addr
    let tokens = JSON.parse(tool.readFromFile(dataPath));
    tokens.push([wwanName, wwanAddr]);

    dataPath = tool.getInputPath('buildProxyConfig');       //get exchange sc addr
    let exchangeSC = JSON.parse(tool.readFromFile(dataPath));

    let exchangeAddr = exchangeSC[0][1];

    contract = await scTool.getDeployedContract('Proxy', proxyAddr);
    let ret = await contract.methods.getAllAddresses().call();
    if (ret[0].toLowerCase() != exchangeAddr.toLowerCase()) {
      tool.logger.error("verifySmartContract failed: Proxy getAllAddresses mismatch!");
      return false
    }
    ret = await contract.methods.owner().call();
    if (ret != '0x0000000000000000000000000000000000000000') {
      tool.logger.error("verifySmartContract failed: Proxy owner mismatch!");
      return false
    }

    contract = await scTool.getDeployedContract('HybridExchange', exchangeAddr);
    ret = await contract.methods.proxyAddress().call();
    if (ret.toLowerCase() != proxyAddr.toLowerCase()) {
      tool.logger.error("verifySmartContract failed: HybridExchange proxy mismatch!");
      return false
    }

    for (let i=0; i<tokens.length; i++) {
      contract = await scTool.getDeployedContract('TestToken', tokens[i][1]);
      ret = await contract.methods.symbol().call();
      console.log(ret, tokens[i][0]);
      if (ret != tokens[i][0] && !tokens[i][0].includes(ret)) {
        tool.logger.error("verifySmartContract failed: Token symbol mismatch!");
        return false
      }
    }

    return true;
  } catch (e) {
    tool.logger.error("verifySmartContract failed: %O", e);
    return false;
  }
}

module.exports = verifySmartContract;