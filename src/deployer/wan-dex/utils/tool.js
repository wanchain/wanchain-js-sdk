const fs = require('fs');
const p = require('path');
const crypto = require('crypto');
const sdkUtil = require('../../../util/util');

global.deployerContext = {};

const logger = sdkUtil.getLogger('wanDexDeployer.js');

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
  let result = { x: '0x' + x.toString('hex'), xHash: '0x' + hash.digest('hex') };
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
  fs.writeFileSync(filePath, content, { flag: 'w', encoding: 'utf8', mode: '0666' })
}

const readFromFile = (filePath) => {
  return fs.readFileSync(filePath, 'utf8');
}

const loadAddress = (type) => {
  try {
    let datePath = getOutputPath(type);
    let data = readFromFile(datePath);
    return new Map(JSON.parse(data));
  } catch { // file not exist
    return new Map();
  }
}

const setAddress = (type, name, address) => {
  let addressMap = loadAddress(type);
  addressMap.set(name, address);
  let datePath = getOutputPath(type);
  write2file(datePath, JSON.stringify([...addressMap]));
}

const getAddress = (type, name) => {
  let addressMap = loadAddress(type);
  if (name) {
    let address = addressMap.get(name);
    if (address) {
      return address;
    } else {
      throw new Error(type + ' failed to get address of contract ' + name);
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
  global.deployerContext[type] = path;
}

// called by internal
const getInputPath = (type) => {
  switch (type) {
    case 'buildPrepareContract':
      return global.deployerContext.buildPrepareContract;
    case 'deployPrepareContract':
      return global.deployerContext.deployPrepareContract;
    case 'buildExchangeContract':
      return global.deployerContext.buildExchangeContract;
    case 'deployExchangeContract':
      return global.deployerContext.deployExchangeContract;
    case 'buildProxyConfig':
      return global.deployerContext.buildProxyConfig;
    case 'sendProxyConfig':
      return global.deployerContext.sendProxyConfig;
    case 'buildRelayerDelegate':
      return global.deployerContext.buildRelayerDelegate;
    case 'sendRelayerDelegate':
      return global.deployerContext.sendRelayerDelegate;
    case 'buildRelayerApprove':
      return global.deployerContext.buildRelayerApprove;
    case 'sendRelayerApprove':
      return global.deployerContext.sendRelayerApprove;
    case 'token_address':
      return global.deployerContext.token_address;
    case 'delegate_address':
      return global.deployerContext.delegate_address;
    default:
      throw new Error('failed to recognize input path type ' + type);
  }
}

// called by wallet or internal
const getOutputPath = (type) => {
  if (!global.deployerContext.dataDir) {
    global.deployerContext.dataDir = p.join(sdkUtil.getConfigSetting('path:datapath'), 'wanDexDeployer');
  }

  switch (type) {
    case 'nonce': return p.join(global.deployerContext.dataDir, 'nonce.json');
    case 'buildPrepareContract':	return	p.join(global.deployerContext.dataDir, 'buildPrepareContract(step1).json');
    case 'deployPrepareContract':	return	p.join(global.deployerContext.dataDir, 'deployPrepareContract(step2).json');
    case 'buildExchangeContract':	return	p.join(global.deployerContext.dataDir, 'buildExchangeContract(step3).json');
    case 'deployExchangeContract':	return	p.join(global.deployerContext.dataDir, 'deployExchangeContract(step4).json');
    case 'buildProxyConfig':	return	p.join(global.deployerContext.dataDir, 'buildProxyConfig(step5).json');
    case 'sendProxyConfig':	return	p.join(global.deployerContext.dataDir, 'sendProxyConfig(step6).json');
    case 'buildRelayerDelegate':	return	p.join(global.deployerContext.dataDir, 'buildRelayerDelegate(step7).json');
    case 'sendRelayerDelegate':	return	p.join(global.deployerContext.dataDir, 'sendRelayerDelegate(step8).json');
    case 'buildRelayerApprove':	return	p.join(global.deployerContext.dataDir, 'buildRelayerApprove(step9).json');
    case 'sendRelayerApprove':	return	p.join(global.deployerContext.dataDir, 'sendRelayerApprove(step10).json');
    default: throw new Error('failed to recognize output path type ' + type);
  }
}

const getNonce = (address) => {
  let nonce = JSON.parse(readFromFile(getOutputPath('nonce')));
  let v = nonce[address.toLowerCase()];
  if (v != undefined) {
    return v;
  } else {
    throw new Error('can not get nonce of address ' + address);
  }
}

const updateNonce = (address, nonce) => {
  let n = {};
  try {
    n = JSON.parse(readFromFile(getOutputPath('nonce')));
  } catch { }
  n[address.toLowerCase()] = Number(nonce);
  write2file(getOutputPath('nonce'), JSON.stringify(n));
}

const setUpgradeComponents = (ComponentArray) => {
  if ((!ComponentArray) || (ComponentArray.length == 0)) {
    throw new Error('invalid parameter');
  }
  let support = ['lib', 'tokenManager', 'htlc', 'storemanGroupAdmin'];
  let result = support.filter(c => ComponentArray.includes(c));
  if ((result.length == 0) || (result.length != ComponentArray.length)) {
    throw new Error('unrecognized component');
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
