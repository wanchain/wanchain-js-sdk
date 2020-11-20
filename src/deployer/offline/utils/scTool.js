const tool = require('./tool');
const Web3 = require('web3');
const ccUtil = require('../../../api/ccUtil');
const WanDataSign = require('../../../trans/data-sign/wan/WanDataSign');
const EthDataSign = require('../../../trans/data-sign/eth/EthDataSign');

const web3 = new Web3();

const signerMap = new Map([
  ['WAN', WanDataSign],
  ['ETH', EthDataSign],
])

function buildScTxData(chain, to, abi, method, paras) {
  if ((chain == 'WAN') || (chain == 'ETH')) {
    let contract = new web3.eth.Contract(abi, to);
    return contract.methods[method](...paras).encodeABI();
  } else {
    throw (new Error('not supported chain'));
  }
}

const serializeTx = async (chain, data, nonce, to, value, walletId, path, gasPrice, gasLimit) => {
  // tool.logger.info("%s txdata: %s", chain, data);
  let Signer = signerMap.get(chain);
  if (!Signer) {
    throw (new Error('not supported chain'));
  }

  if (data && (0 != data.indexOf('0x'))) {
    data = '0x' + data;
  }

  value = web3.utils.toWei(value, 'ether');
  value = new web3.utils.BN(value);
  value = '0x' + value.toString(16);

  let from = await path2Address(chain, walletId, path);
  // tool.logger.info("%s serializeTx address: %O", chain, from);

  let tx = {
    commonData: {nonce, gasPrice, gasLimit, to, value, from},
    contractData: data
  };
  if (chain == 'WAN') {
    tx.commonData.Txtype = 0x01; // wanchain only
  }
  // tool.logger.info("%s serializeTx: %O", chain, tx);
  let signer = new Signer({walletID: walletId, BIP44Path: path});
  let result = await signer.sign(tx);
  // tool.logger.info("%s serializeTx sign result: %O", chain, result);
  return result.result;
}

const sendSerializedTx = async (chain, tx) => {
  let txHash = await ccUtil.sendTrans(tx, chain);
  tool.logger.info("%s sendSerializedTx hash: %s", chain, txHash)
  return txHash;
}

const waitReceipt = async (chain, txHash, isDeploySc, times = 0) => {
  if (times >= 300) {
    tool.logger.info("%s tx %s receipt timeout", chain, txHash);
    return null;
  }
  try {
    let response = await ccUtil.getTxReceipt(chain, txHash);
    // tool.logger.info("%s tx %s waitReceipt times %d response: %O", chain, txHash, times, response);
    if (isDeploySc) {
      if (response.status == '0x1') {
        return response.contractAddress;
      } else {
        tool.logger.error("%s tx %s times %d receipt failed", chain, txHash, times);
        return null;
      }
    } else {
      return (response.status == '0x1');
    }
  } catch(e) {
    // tool.logger.info("%s tx %s waitReceipt times %d none: %O", chain, txHash, times, e);
    return await waitReceipt(chain, txHash, isDeploySc, times + 1);
  }
}

const path2Address = async (chain, walletId, path) => {
  let chn = global.chainManager.getChain(chain);
  let addr = await chn.getAddress(walletId, path);
  return ccUtil.hexAdd0x(addr.address); // NOTE: only for WAN and ETH now
}

const initNonce = async (chain, walletId, path) => {
  let address = await path2Address(chain, walletId, path);
  let nonce = await getNonce(chain, address);
  tool.updateNonce(chain, address, nonce);
  return nonce;
}

const getNonce = async (chain, address) => {
  let nonce = await ccUtil.getNonce(ccUtil.hexAdd0x(address), chain);
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