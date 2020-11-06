const fs = require('fs');
const p = require('path');
const crypto = require('crypto');
const sdkUtil = require('../../../util/util');

global.deployerContext = {};

const logger = sdkUtil.getLogger("offlineDeployer.js");

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
const getOutputPath = (type, para) => {
  if (!global.deployerContext.dataDir) {
    global.deployerContext.dataDir = p.join(sdkUtil.getConfigSetting('path:datapath'), 'offlineDeployer');
  }
  if (type == 'nonce') { // internal
    return p.join(global.deployerContext.dataDir, 'nonce.json');
  } else if (type == 'sendTx') { // offline
    return p.join(global.deployerContext.dataDir, 'txData/', para + '.dat');
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

module.exports = {
  logger,
  str2hex,
  cmpAddress,
  getHash,
  write2file,
  readFromFile,
  setFilePath,
  getInputPath,
  getOutputPath,
  getNonce,
  updateNonce
}
