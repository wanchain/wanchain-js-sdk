const scTool = require('../utils/scTool');

async function deployExchangeContract() {
  return scTool.sendDeploy('deployExchangeContract', true);
}

module.exports = deployExchangeContract;
