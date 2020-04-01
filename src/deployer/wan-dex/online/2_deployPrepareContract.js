const scTool = require('../utils/scTool');

async function deployPrepareContract() {
  return scTool.sendDeploy('deployPrepareContract', true);
}

module.exports = deployPrepareContract;