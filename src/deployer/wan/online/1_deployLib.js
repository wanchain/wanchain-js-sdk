const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

async function deployLib(walletId, path) {
  let compiled, address;

  try {
    // HTLCLib
    compiled = scTool.compileContract('HTLCLib');
    address = await scTool.deployLib('HTLCLib', compiled, walletId, path);
    tool.setAddress('lib', 'HTLCLib', address);

    // QuotaLib
    compiled = scTool.compileContract('QuotaLib');
    address = await scTool.deployLib('QuotaLib', compiled, walletId, path);
    tool.setAddress('lib', 'QuotaLib', address);

    // Secp256k1
    compiled = scTool.compileContract('Secp256k1');
    address = await scTool.deployLib('Secp256k1', compiled, walletId, path);
    tool.setAddress('lib', 'Secp256k1', address);

    // SchnorrVerifier
    compiled = scTool.compileContract('SchnorrVerifier');
    scTool.linkContract(compiled, ['Secp256k1']);
    address = await scTool.deployLib('SchnorrVerifier', compiled, walletId, path);
    tool.setAddress('lib', 'SchnorrVerifier', address);

    // HTLCUserLib
    compiled = scTool.compileContract('HTLCUserLib');
    scTool.linkContract(compiled, ['QuotaLib', 'HTLCLib']);
    address = await scTool.deployLib('HTLCUserLib', compiled, walletId, path);
    tool.setAddress('lib', 'HTLCUserLib', address);
    
    // HTLCDebtLib
    compiled = scTool.compileContract('HTLCDebtLib');
    scTool.linkContract(compiled, ['SchnorrVerifier', 'QuotaLib', 'HTLCLib']);
    address = await scTool.deployLib('HTLCDebtLib', compiled, walletId, path);
    tool.setAddress('lib', 'HTLCDebtLib', address);

    // HTLCSmgLib
    compiled = scTool.compileContract('HTLCSmgLib');
    scTool.linkContract(compiled, ['SchnorrVerifier', 'QuotaLib', 'HTLCLib']);
    address = await scTool.deployLib('HTLCSmgLib', compiled, walletId, path);
    tool.setAddress('lib', 'HTLCSmgLib', address);
  
    return true;
  } catch (e) {
    tool.logger.error("deployLib failed: %O", e);
    return false;
  }
}

module.exports = deployLib;