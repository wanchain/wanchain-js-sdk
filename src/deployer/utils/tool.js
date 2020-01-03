const fs = require('fs');
const path = require('path');

const createFolder = (filePath) => { 
  var sep = path.sep
  var folders = path.dirname(filePath).split(sep);
  var p = '';
  while (folders.length) {
    p += folders.shift() + sep;
    if (!fs.existsSync(p)) {
      fs.mkdirSync(p);
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

const getInputPath = (type) => {
  if (type == 'token') {
    return path.join(__dirname, "../token.json");
  } else if (type == 'smg') {
    return path.join(__dirname, "../smg.json");
  } else {
    return path.join(__dirname, "..");
  }
}

const getOutputPath = (type) => {
  if (type == 'nonce') {
    return path.join(__dirname, "../nonce.json");
  } else if (type == 'contractAddress') {
    return path.join(__dirname, "../contractAddress.json");
  } else if (type == 'txData') {  // folder
    return path.join(__dirname, "../txData/");
  } else {
    return path.join(__dirname, "..");
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
  getInputPath,
  getOutputPath,
  str2hex,
  getNonce,
  updateNonce
}
