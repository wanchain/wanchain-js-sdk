const scTool = require('../utils/scTool');

async function sendProxyConfig() {
  return scTool.sendDeploy('sendJackPotConfig');
}

module.exports = sendProxyConfig;
