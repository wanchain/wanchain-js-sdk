const fs = require('fs');
const p = require('path');
const sdkUtil = require('../../../util/util');

global.deployerContext = {};

const logger = sdkUtil.getLogger("offlineDeployer.js");

const sleep = (seconds) => {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000))
}

const cmpAddress = (address1, address2) => {
  return (address1.toLowerCase() == address2.toLowerCase());
}

const createFolder = (filePath) => { 
  var sep = p.sep
  var folders = p.dirname(filePath).split(sep);
  var tmp = '';
  while (folders.length) {
    tmp += folders.shift() + sep;
    if (!fs.existsSync(tmp)) {
      fs.mkdirSync(tmp);
    }
  }
}

const write2file = (filePath, content) => {
  createFolder(filePath);
  fs.writeFileSync(filePath, content, {flag: 'w', encoding: 'utf8', mode: '0666'})
}

const readFromFile = (filePath) => {
  return fs.readFileSync(filePath, 'utf8');
}

// called by wallet
const setFilePath = (type, path) => {
  if (type == 'sendTx') { // online
    global.deployerContext.sendTx = path;
  } else {
    throw new Error("failed to recognize file path type " + type);
  }
}

// called by internal
const getInputPath = (type) => {
  if (type == 'sendTx') { // online
    return global.deployerContext.sendTx;
  } else {
    throw new Error("failed to recognize input path type " + type);
  }
}

// called by wallet or internal
const getOutputPath = (type) => {
  if (!global.deployerContext.dataDir) {
    global.deployerContext.dataDir = p.join(sdkUtil.getConfigSetting('path:datapath'), 'offlineDeployer');
  }
  if (type == 'sendTx') { // offline
    let uid = new Date().toISOString();
    uid = uid.substr(0, uid.indexOf('T')).replace(/:/g, '-');
    let fileName = 'offline-signed-' + uid + '.dat';
    return p.join(global.deployerContext.dataDir, 'txData/', fileName);
  } else {
    throw new Error("failed to recognize output path type " + type);
  }
}

module.exports = {
  logger,
  sleep,
  cmpAddress,
  write2file,
  readFromFile,
  setFilePath,
  getInputPath,
  getOutputPath,
}
