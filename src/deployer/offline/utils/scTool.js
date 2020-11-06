const tool = require('./tool');
const Web3 = require('web3');
const cfg = require('../config.json');
const ccUtil = require('../../../api/ccUtil');
const WanDataSign = require('../../../trans/data-sign/wan/WanDataSign');

const web3 = new Web3();

function buildScTxData(address, abi, method, paras) {
  let contract = new web3.eth.Contract(abi, address);
  return contract.methods[method](...paras).encodeABI();
}

const serializeTx = async (data, nonce, contractAddr, value, walletId, path) => {
  // tool.logger.info("txdata=" + data);
  if (0 != data.indexOf('0x')){
    data = '0x' + data;
  }

  value = web3.utils.toWei(value, 'ether');
  value = new web3.utils.BN(value);
  value = '0x' + value.toString(16);

  let sender = await path2Address(walletId, path);
  // tool.logger.info("serializeTx address: %O", sender);

  let tx = {};
  tx.commonData = {
      Txtype: 0x01, // wanchain only
      nonce: nonce,
      gasPrice: cfg.gasPrice,
      gasLimit: cfg.gasLimit,
      to: contractAddr,
      value: value,
      from: sender
  };
  tx.contractData = data;
  // tool.logger.info("serializeTx: %O", tx);
  let signer = new WanDataSign({walletID: walletId, BIP44Path: path});
  let result = await signer.sign(tx);
  // tool.logger.info("serializeTx sign result: %O", result);
  return result.result;
}

const sendSerializedTx = async (tx) => {
  let txHash = await ccUtil.sendTrans(tx, 'WAN');
  tool.logger.info("sendSerializedTx hash: %s", txHash)  
  return txHash;
}

const waitReceipt = async (txHash, isDeploySc, times = 0) => {
  if (times >= 300) {
    tool.logger.info("%s receipt timeout", txHash);
    return null;
  }
  try {
    let response = await ccUtil.getTxReceipt('WAN', txHash);
    // tool.logger.info("waitReceipt %s times %d response: %O", txHash, times, response);
    if (isDeploySc) {
      if (response.status == '0x1') {
        return response.contractAddress;
      } else {
        tool.logger.error("%s times %d receipt failed", txHash, times);
        return null;
      }
    } else {
      return (response.status == '0x1');
    }
  } catch(e) {
    // tool.logger.info("waitReceipt %s times %d none: %O", txHash, times, e);
    return await waitReceipt(txHash, isDeploySc, times + 1);
  }
}

const path2Address = async (walletId, path) => {
  let chain = global.chainManager.getChain('WAN');
  let address = await chain.getAddress(walletId, path);
  return ccUtil.hexAdd0x(address.address);
}

const initNonce = async (walletId, path) => {
  let address = await path2Address(walletId, path);
  let nonce = await getNonce(address);
  tool.updateNonce(address, nonce);
  return nonce;
}

const getNonce = async (address) => {
  let nonce = await ccUtil.getNonce(ccUtil.hexAdd0x(address), 'WAN');
  return nonce;
}

const wan2win = (wan) => {
  return web3.utils.toWei(wan.toString(), 'ether');
}

module.exports = {
  buildScTxData,
  serializeTx,
  sendSerializedTx,
  waitReceipt,
  path2Address,
  initNonce,
  getNonce,
  wan2win
}