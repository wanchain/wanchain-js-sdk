const scTool = require('../utils/scTool');

async function sendRelayerApprove() {
  return scTool.sendDeploy('sendRelayerApprove');
}

module.exports = sendRelayerApprove;
