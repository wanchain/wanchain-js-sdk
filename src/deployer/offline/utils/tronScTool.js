const tool = require('./tool');
const Web3 = require('web3');
const ccUtil = require('../../../api/ccUtil');
const {Client} = require("@tronscan/client");
const TronWeb = require('tronweb');

const fullNode = 'https://api.nileex.io';
const solidityNode = 'https://api.nileex.io';
const eventServer = 'https://api.nileex.io';
const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, '');

const web3 = new Web3();
const client = new Client();

function buildScTxData(chain, to, abi, method, paras, context) {
  to = base58Address2Hex(to, true);
  let contract = new web3.eth.Contract(abi, to);
  return contract.methods[method](...paras).encodeABI();
}

const serializeTx = async (chain, data, to, value, walletId, path, feeLimit, refBlock, expiration) => {
  if (0 === data.indexOf('0x')) {
    data = data.substr(2);
  }
  value = value * (10 ** 6);
  feeLimit = feeLimit * (10 ** 6);
  let from = await path2Address(chain, walletId, path);
  // tool.logger.info("%s serializeTx address: %O", chain, from);
  let txValue = {
    owner_address: base58Address2Hex(from),
    contract_address: base58Address2Hex(to),
    data
  };
  // tool.logger.info("%s serializeTx: %O", chain, {txValue, refBlock, expiration});
  let tx = await client.getTriggerSmartContractTransaction(txValue);
  let sk = await path2Sk(chain, walletId, path);
  let result = await client.offlineSignTransaction(sk, tx, refBlock, expiration);
  // tool.logger.info("%s serializeTx sign result: %O", chain, result);
  return result;
}

const sendSerializedTx = async (chain, tx) => {
  let result = await tronWeb.trx.sendHexTransaction(tx);
  let txHash = result.txid;
  tool.logger.info("%s sendSerializedTx hash: %O", chain, txHash);
  return txHash;
}

const waitReceipt = async (chain, txHash, isDeploySc, seconds = 0) => {
  if (seconds >= 7200) {
    tool.logger.info("%s tx %s receipt timeout", chain, txHash);
    return null;
  }
  try {
    let response = await ccUtil.getTxReceipt(chain, txHash);
    // tool.logger.info("%s tx %s waitReceipt seconds %d response: %O", chain, txHash, seconds, response);
    if (isDeploySc) {
      if (response.status == '0x1') {
        return response.contractAddress;
      } else {
        tool.logger.error("%s tx %s seconds %d receipt failed", chain, txHash, seconds);
        return null;
      }
    } else {
      return (response.status == '0x1');
    }
  } catch(e) {
    // tool.logger.info("%s tx %s waitReceipt seconds %d none: %O", chain, txHash, seconds, e);
    await tool.sleep(5);
    return await waitReceipt(chain, txHash, isDeploySc, seconds + 5);
  }
}

const path2Address = async (chain, walletId, path) => {
  let chn = global.chainManager.getChain("TRX");
  let addr = await chn.getAddress(walletId, path);
  return addr.address;
}

const base58Address2Hex = (address, isEvm = false) => {
  let hex = tronWeb.address.toHex(address);
  if (isEvm) {
    hex = '0x' + hex.slice(2);
  }
  return hex;
}

const path2Sk = async (chain, walletId, path) => {
  let chn = global.chainManager.getChain("TRX");
  let sk = await chn.getPrivateKeys(walletId, path);
  return sk[0];
}

module.exports = {
  buildScTxData,
  serializeTx,
  sendSerializedTx,
  waitReceipt,
  path2Address,
  base58Address2Hex
}