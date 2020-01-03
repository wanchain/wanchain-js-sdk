const scTool = require('../utils/scTool');
const contractAddress = require('../contractAddress');

async function deployLib(walletId, path) {
  let compiled, address;

  // HTLCLib
  compiled = scTool.compileContract('HTLCLib');
  address = await scTool.deployContract('HTLCLib', compiled, walletId, path);
  if (address) {
    contractAddress.setAddress('HTLCLib', address);
  } else {
    return false;
  }

  // QuotaLib
  compiled = scTool.compileContract('QuotaLib');
  address = await scTool.deployContract('QuotaLib', compiled, walletId, path);
  if (address) {
    contractAddress.setAddress('QuotaLib', address);
  } else {
    return false;
  }

  // Secp256k1
  compiled = scTool.compileContract('Secp256k1');
  address = await scTool.deployContract('Secp256k1', compiled, walletId, path);
  if (address) {
    contractAddress.setAddress('Secp256k1', address);
  } else {
    return false;
  }

  // SchnorrVerifier
  compiled = scTool.compileContract('SchnorrVerifier');
  scTool.linkContract(compiled, ['Secp256k1']);
  address = await scTool.deployContract('SchnorrVerifier', compiled, walletId, path);
  if (address) {
    contractAddress.setAddress('SchnorrVerifier', address);
  } else {
    return false;
  }

  // HTLCUserLib
  compiled = scTool.compileContract('HTLCUserLib');
  scTool.linkContract(compiled, ['QuotaLib', 'HTLCLib']);
  address = await scTool.deployContract('HTLCUserLib', compiled, walletId, path);
  if (address) {
    contractAddress.setAddress('HTLCUserLib', address);
  } else {
    return false;
  }
  
  // HTLCDebtLib
  compiled = scTool.compileContract('HTLCDebtLib');
  scTool.linkContract(compiled, ['SchnorrVerifier', 'QuotaLib', 'HTLCLib']);
  address = await scTool.deployContract('HTLCDebtLib', compiled, walletId, path);
  if (address) {
    contractAddress.setAddress('HTLCDebtLib', address);
  } else {
    return false;
  }

  // HTLCSmgLib
  compiled = scTool.compileContract('HTLCSmgLib');
  scTool.linkContract(compiled, ['SchnorrVerifier', 'QuotaLib', 'HTLCLib']);
  address = await scTool.deployContract('HTLCSmgLib', compiled, walletId, path);
  if (address) {
    contractAddress.setAddress('HTLCSmgLib', address);
  } else {
    return false;
  }
 
  return true;
}

module.exports = deployLib;