const fs = require('fs');
const p = require('path');

global.deployerContext = {};

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

const setFilePath = (type, path) => {
  if (type == 'dataDir') {
    global.deployerContext.dataDir = p.join(path, 'deployer');
  } else if (type == 'token') {
    global.deployerContext.tokenFile = path;
  } else if (type == 'smg') {
    global.deployerContext.smgFile = path;
  }
}

const getInputPath = (type) => {
  if (type == 'token') {
    return global.deployerContext.tokenFile;
  } else if (type == 'smg') {
    return global.deployerContext.smgFile;
  } else {
    return null;
  }
}

const getOutputPath = (type) => {
  if (type == 'nonce') {
    return p.join(global.deployerContext.dataDir, 'nonce.json');
  } else if (type == 'contractAddress') {
    return p.join(global.deployerContext.dataDir, 'contractAddress.json');
  } else if (type == 'txDataDir') {
    return p.join(global.deployerContext.dataDir, 'txData');
  } else {
    return null;
  }
}

const str2hex = (str) => {
  let content = new Buffer.from(str).toString('hex');
  return '0x' + content;
}

const getNonce = (address) => {
  let nonce = JSON.parse(readFromFile(getOutputPath('nonce')));
  return nonce[address];
}

const updateNonce = (address, nonce) => {
  let n = {};
  try {
    n = JSON.parse(readFromFile(getOutputPath('nonce')));
  } catch {}
  n[address] = Number(nonce);
  write2file(getOutputPath('nonce'), JSON.stringify(n));
}

module.exports = {
  write2file,
  readFromFile,
  setFilePath,
  getInputPath,
  getOutputPath,
  str2hex,
  getNonce,
  updateNonce
}
