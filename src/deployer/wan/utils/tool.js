const fs = require('fs');
const p = require('path');
const crypto = require('crypto');
const sdkUtil = require('../../../util/util');

global.deployerContext = {};

const logger = sdkUtil.getLogger("wanDeployer.js");

const str2hex = (str) => {
  let content = new Buffer.from(str).toString('hex');
  return '0x' + content;
}

const cmpAddress = (address1, address2) => {
  return (address1.toLowerCase() == address2.toLowerCase());
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

const loadAddress = (type) => {
  try {
    let datePath = getInputPath(type + 'Address');
    let data = readFromFile(datePath);
    return new Map(JSON.parse(data));
  } catch { // file not exist
    return new Map();
  }
}

const setAddress = (type, name, address) => {
  let addressMap = loadAddress(type);
  addressMap.set(name, address);
  let datePath = getOutputPath(type + 'Address');
  write2file(datePath, JSON.stringify([...addressMap]));
}

const getAddress = (type, name) => {
  let addressMap = loadAddress(type);
  if (name) {
    let address = addressMap.get(name);
    if (address) {
      return address;
    } else {
      throw new Error(type + " failed to get address of contract " + name);
    }
  } else {
    return addressMap;
  }
}

const mergeAddress = (destType, srcFilePath) => {
  let data = readFromFile(srcFilePath);
  let upgradeMap = new Map(JSON.parse(data));
  for (let [name, address] of upgradeMap) {
    setAddress(destType, name, address);
  }
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
  } else if (type == 'upgradeContractAddress') { // offline
    mergeAddress('contract', path);
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
  } else if (type == 'upgradeContractAddress') { // online
    return getOutputPath('upgradeContractAddress');
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
    return p.join(global.deployerContext.dataDir, 'txData/upgradeContract(step2).dat');
  } else if (type == 'upgradeContractAddress') { // online
    return p.join(global.deployerContext.dataDir, 'upgradeContractAddress(step3).json');
  } else if (type == 'upgradeDependency') { // offline
    return p.join(global.deployerContext.dataDir, 'txData/upgradeDependency(step4).dat');
  } else {
    throw new Error("failed to recognize output path type " + type);
  }
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

const setUpgradeComponents = (ComponentArray) => {
  if ((!ComponentArray) || (ComponentArray.length == 0)) {
    throw new Error("invalid parameter");
  }
  let support = ['lib', 'tokenManager', 'htlc', 'storemanGroupAdmin'];
  let result = support.filter(c => ComponentArray.includes(c));
  if ((result.length == 0) || (result.length != ComponentArray.length)) {
    throw new Error("unrecognized component");
  }
  global.deployerContext.upgradeComponents = result;
}

module.exports = {
  logger,
  str2hex,
  cmpAddress,
  getHash,
  write2file,
  readFromFile,
  setAddress,
  getAddress,
  mergeAddress,  
  setFilePath,
  getInputPath,
  getOutputPath,
  getNonce,
  updateNonce,
  setUpgradeComponents
}
