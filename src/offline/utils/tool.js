const sdkUtil = require('../../util/util');

global.deployerContext = {};

const logger = sdkUtil.getLogger("offlineDeployer.js");

const sleep = (seconds) => {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000))
}

const cmpAddress = (address1, address2) => {
  return (address1.toLowerCase() == address2.toLowerCase());
}

module.exports = {
  logger,
  sleep,
  cmpAddress,
}
