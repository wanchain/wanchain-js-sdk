const scTool = require('../utils/scTool');

async function sendRelayerDelegate() {
  return scTool.sendDeploy('sendRelayerDelegate');
}

module.exports = sendRelayerDelegate;
