const scTool = require('../utils/scTool');

async function sendProxyConfig() {
  return scTool.sendDeploy('sendProxyConfig');
}

module.exports = sendProxyConfig;
