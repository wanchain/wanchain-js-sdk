const fs = require('fs');
const p = require('path');
const crypto = require('crypto');
const sdkUtil = require('../../../util/util');

global.deployerContext = {};

const logger = sdkUtil.getLogger("wanDeployer.js");

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
  if (type == 'token') { // offline
    global.deployerContext.token = path;
  } else if (type == 'smg') { // offline
    global.deployerContext.smg = path;
  } else if (type == 'libAddress') { // offline
    global.deployerContext.libAddress = path;
  } else if (type == 'contractAddress') { // online
    let dest = getOutputPath('contractAddress');
    if (p.normalize(path) != p.normalize(dest)) {
      createFolder(dest);
      fs.copyFileSync(path, dest); // save file to avoid duplicate set
    }
  } else if (type == 'deployContract') { // online
    global.deployerContext.deployContract = path;
  } else if (type == 'setDependency') { // online
    global.deployerContext.setDependency = path;
  } else if (type == 'registerToken') { // online
    global.deployerContext.registerToken = path;
  } else if (type == 'registerSmg') { // online
    global.deployerContext.registerSmg = path;
  } else if (type == 'update') { // online
    global.deployerContext.update = path;
  } else if (type == 'upgradeContract') { // online
    global.deployerContext.upgradeContract = path;
  } else if (type == 'upgradeDependency') { // online
    global.deployerContext.upgradeDependency = path;
  } else {
    throw new Error("failed to recognize file path type " + type);
  }
}

// called by internal
const getInputPath = (type) => {
  if (type == 'token') { // offline
    return global.deployerContext.token;
  } else if (type == 'smg') { // offline
    return global.deployerContext.smg;
  } else if (type == 'libAddress') { // offline
    return global.deployerContext.libAddress;
  } else if (type == 'contractAddress') { // online
    return getOutputPath('contractAddress');
  } else if (type == 'deployContract') { // online
    return global.deployerContext.deployContract;
  } else if (type == 'setDependency') { // online
    return global.deployerContext.setDependency;
  } else if (type == 'registerToken') { // online
    return global.deployerContext.registerToken;
  } else if (type == 'registerSmg') { // online
    return global.deployerContext.registerSmg;
  } else if (type == 'update') { // online
    return global.deployerContext.update;
  } else if (type == 'upgradeContract') { // online
    return global.deployerContext.upgradeContract;
  } else if (type == 'upgradeDependency') { // online
    return global.deployerContext.upgradeDependency;
  } else {
    throw new Error("failed to recognize input path type " + type);
  }
}

// called by wallet or internal
const getOutputPath = (type) => {
  if (!global.deployerContext.dataDir) {
    global.deployerContext.dataDir = p.join(sdkUtil.getConfigSetting('path:datapath'), 'wanDeployer');
  }
  if (type == 'nonce') { // internal
    return p.join(global.deployerContext.dataDir, 'nonce.json');
  } else if (type == 'libAddress') { // online
    return p.join(global.deployerContext.dataDir, 'libAddress.json');
  } else if (type == 'contractAddress') { // online, offline internal
    return p.join(global.deployerContext.dataDir, 'contractAddress(step3).json');
  } else if (type == 'deployContract') { // offline
    return p.join(global.deployerContext.dataDir, 'txData/deployContract(step2).dat');
  } else if (type == 'setDependency') { // offline
    return p.join(global.deployerContext.dataDir, 'txData/setDependency(step4).dat');
  } else if (type == 'registerToken') { // offline
    return p.join(global.deployerContext.dataDir, 'txData/registerToken.dat');
  } else if (type == 'registerSmg') { // offline
    return p.join(global.deployerContext.dataDir, 'txData/registerSmg.dat');
  } else if (type == 'update') { // offline
    return p.join(global.deployerContext.dataDir, 'txData/update.dat');
  } else if (type == 'upgradeContract') { // offline
    return p.join(global.deployerContext.dataDir, 'txData/upgradeContract.dat');
  } else if (type == 'upgradeDependency') { // offline
    return p.join(global.deployerContext.dataDir, 'txData/upgradeDependency.dat');
  } else {
    throw new Error("failed to recognize output path type " + type);
  }
}

const str2hex = (str) => {
  let content = new Buffer.from(str).toString('hex');
  return '0x' + content;
}

const getNonce = (address) => {
  let nonce = JSON.parse(readFromFile(getOutputPath('nonce')));
  let v = nonce[address.toLowerCase()];
  if (v != undefined) {
    return v;
  } else {
    throw new Error("can not get nonce of address " + address);
  }
}

const updateNonce = (address, nonce) => {
  let n = {};
  try {
    n = JSON.parse(readFromFile(getOutputPath('nonce')));
  } catch {}
  n[address.toLowerCase()] = Number(nonce);
  write2file(getOutputPath('nonce'), JSON.stringify(n));
}

const getHash = (x) => {
  if (x == undefined) {
    x = crypto.randomBytes(32);
  } else {
    x = Buffer.from((Array(63).fill('0').join('') + x.toString(16)).slice(-64), 'hex');
  }
  hash = crypto.createHash('sha256').update(x);
  let result = {x: '0x' + x.toString('hex'), xHash: '0x' + hash.digest('hex')};
  return result;
}

module.exports = {
  logger,
  write2file,
  readFromFile,
  setFilePath,
  getInputPath,
  getOutputPath,
  str2hex,
  getNonce,
  updateNonce,
  getHash,
}
