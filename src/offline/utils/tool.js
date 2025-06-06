const sdkUtil = require('../../util/util');

const logger = sdkUtil.getLogger("offline.js");

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
