const tool = require('../utils/tool');
const scTool = require('../utils/scTool');
const libAddress = require('../libAddress');

async function deployLib(walletId, path) {
  let compiled, address;

  try {
    // HTLCLib
    compiled = scTool.compileContract('HTLCLib');
    address = await scTool.deployContract('HTLCLib', compiled, walletId, path);
    libAddress.setAddress('HTLCLib', address);

    // QuotaLib
    compiled = scTool.compileContract('QuotaLib');
    address = await scTool.deployContract('QuotaLib', compiled, walletId, path);
    libAddress.setAddress('QuotaLib', address);

    // Secp256k1
    compiled = scTool.compileContract('Secp256k1');
    address = await scTool.deployContract('Secp256k1', compiled, walletId, path);
    libAddress.setAddress('Secp256k1', address);

    // SchnorrVerifier
    compiled = scTool.compileContract('SchnorrVerifier');
    scTool.linkContract(compiled, ['Secp256k1']);
    address = await scTool.deployContract('SchnorrVerifier', compiled, walletId, path);
    libAddress.setAddress('SchnorrVerifier', address);

    // HTLCUserLib
    compiled = scTool.compileContract('HTLCUserLib');
    scTool.linkContract(compiled, ['QuotaLib', 'HTLCLib']);
    address = await scTool.deployContract('HTLCUserLib', compiled, walletId, path);
    libAddress.setAddress('HTLCUserLib', address);
    
    // HTLCDebtLib
    compiled = scTool.compileContract('HTLCDebtLib');
    scTool.linkContract(compiled, ['SchnorrVerifier', 'QuotaLib', 'HTLCLib']);
    address = await scTool.deployContract('HTLCDebtLib', compiled, walletId, path);
    libAddress.setAddress('HTLCDebtLib', address);

    // HTLCSmgLib
    compiled = scTool.compileContract('HTLCSmgLib');
    scTool.linkContract(compiled, ['SchnorrVerifier', 'QuotaLib', 'HTLCLib']);
    address = await scTool.deployContract('HTLCSmgLib', compiled, walletId, path);
    libAddress.setAddress('HTLCSmgLib', address);
  
    return true;
  } catch (e) {
    tool.logger.error("deployLib failed: %O", e);
    return false;
  }
}

module.exports = deployLib;