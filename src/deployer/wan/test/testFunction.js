const tool = require('../utils/tool');
const scTool = require('../utils/scTool');
const schnorr = require('./schnorr')

const smgSk = new Buffer("097e961933fa62e3fef5cedef9a728a6a927a4b29f06a15c6e6c52c031a6cb2b", 'hex');
const smgPk = schnorr.getPKBySk(smgSk); // "0x04cb54bc900646fe8de5c8db04e4120e38cb61b3e000ae37e4ecdaf71b777f7ec71f81f87d21eb46e372105a3d123af9a94e0760f9c13738b8ca1abf248a9104f2"

const R = schnorr.getR();

function buildParas(...paras) {
  let result = [];
  for (let para of paras) {
    result.push(para);
  }
  return result;
}

async function testFunction(walletId, path) {
  let contract, hash, txData, serialized, txHash, success;

  // get token info
  let tokenPath = tool.getInputPath('token');
  let tokenArray = require(tokenPath);
  let token = tokenArray[0];

  // check storeman group info
  let smgArray = require(tool.getInputPath('smg'));
  if (smgPk != smgArray[0].storemanGroup) {
    console.error("test storeman group PK is not registered: %s", smgPk);
    return false;
  }

  // sender
  let sender = await scTool.path2Address(walletId, path);
  let nonce = await scTool.getNonce(sender);

  // user info
  let wanUser = sender;
  let userOrigAccount = tool.str2hex('eos');

  // get htlc contract
  let htlcProxyAddress = tool.getAddress('contract', 'HTLCProxy'); 
  contract = await scTool.getDeployedContract('HTLCDelegate', htlcProxyAddress);

  // get token contract
  let wTokenAddress = tool.getAddress('contract', token.symbol);
  let wToken = await scTool.getDeployedContract('WanToken', wTokenAddress);  

  // inSmgLock
  let typeList = ['bytes', 'bytes32', 'address', 'uint'];
  hash = tool.getHash();
  let valueList = buildParas(token.tokenOrigAccount, hash.xHash, wanUser, '0x1');    
  let s = schnorr.getS(smgSk, typeList, valueList);
  txData = await contract.methods.inSmgLock(token.tokenOrigAccount, hash.xHash, wanUser, 1, smgPk, R, s).encodeABI();
  serialized = await scTool.serializeTx(txData, nonce++, htlcProxyAddress, '0', walletId, path);
  txHash = await scTool.sendSerializedTx(serialized);
  success = await scTool.waitReceipt(txHash, false);
  if (success) {
    console.log("inSmgLock success");
  } else {
    console.error("inSmgLock failed");
    return false;
  }

  // inUserRedeem
  txData = await contract.methods.inUserRedeem(hash.x).encodeABI();
  serialized = await scTool.serializeTx(txData, nonce++, htlcProxyAddress, '0', walletId, path);
  txHash = await scTool.sendSerializedTx(serialized);
  success = await scTool.waitReceipt(txHash, false);
  if (success) {
    console.log("inUserRedeem success");
  } else {
    console.error("inUserRedeem failed");
    return false;
  }

  // approve for outUserLock
  txData = await wToken.methods.approve(htlcProxyAddress, 1).encodeABI();
  serialized = await scTool.serializeTx(txData, nonce++, wTokenAddress, '0', walletId, path);
  txHash = await scTool.sendSerializedTx(serialized);
  success = await scTool.waitReceipt(txHash, false);
  if (success) {
    console.log("approve for outUserLock success");
  } else {
    console.error("approve for outUserLock failed");
    return false;
  }

  // outUserLock
  hash = tool.getHash();
  txData = await contract.methods.outUserLock(hash.xHash, 1, token.tokenOrigAccount, userOrigAccount, smgPk).encodeABI();
  serialized = await scTool.serializeTx(txData, nonce++, htlcProxyAddress, '0', walletId, path);
  txHash = await scTool.sendSerializedTx(serialized);
  success = await scTool.waitReceipt(txHash, false);
  if (success) {
    console.log("outUserLock success");
  } else {
    console.error("outUserLock failed");
    return false;
  }

  // outSmgRedeem
  txData = await contract.methods.outSmgRedeem(hash.x).encodeABI();
  serialized = await scTool.serializeTx(txData, nonce++, htlcProxyAddress, '0', walletId, path);
  txHash = await scTool.sendSerializedTx(serialized);
  success = await scTool.waitReceipt(txHash, false);
  if (success) {
    console.log("outSmgRedeem success");
  } else {
    console.error("outSmgRedeem failed");
    return false;
  }

  return true;
}

module.exports = testFunction;