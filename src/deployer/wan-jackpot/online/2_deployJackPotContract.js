const scTool = require('../utils/scTool');

async function deployJackPotContract() {
  return scTool.sendDeploy('deployJackPotContract', true);
}

module.exports = deployJackPotContract;