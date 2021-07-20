const tool = require('./tool');
const Web3 = require('web3');
const ccUtil = require('../../../api/ccUtil');
const WanDataSign = require('../../../trans/data-sign/wan/WanDataSign');
const EthDataSign = require('../../../trans/data-sign/eth/EthDataSign');
const BigNumber = require('bignumber.js');
const wanUtil= require('../../../util/util');

const web3 = new Web3();

const signerMap = new Map([
  ['WAN', {signer: WanDataSign, mainnetChainId: '0x01', testnetChainId: '0x03'}],
  ['ETH', {signer: EthDataSign, mainnetChainId: '0x01', testnetChainId: '0x04'}],
  ['BSC', {signer: EthDataSign, mainnetChainId: '0x38', testnetChainId: '0x61'}],
  ['Avalanche', {signer: EthDataSign, mainnetChainId: '0xa86a', testnetChainId: '0xa869'}],
  ['Moonbeam', {signer: EthDataSign, mainnetChainId: '0x504', testnetChainId: '0x507'}],
  ['Matic', {signer: EthDataSign, mainnetChainId: '0x89', testnetChainId: '0x13881'}],
  ['Custom', {signer: EthDataSign, mainnetChainId: '-1', testnetChainId: '-1'}],
])

function buildScTxData(chain, to, abi, method, paras) {
  let contract = new web3.eth.Contract(abi, to);
  return contract.methods[method](...paras).encodeABI();
}

const serializeTx = async (chain, data, nonce, to, value, walletId, path, gasPrice, gasLimit, _chainId) => {
  // tool.logger.info("%s txdata: %s", chain, data);
  let usedChain = signerMap.get(chain);
  if (!usedChain) {
    throw (new Error('not supported chain'));
  }

  if (chain === 'Custom') {
    console.log('Custom network, chainId: ', _chainId);
    usedChain.mainnetChainId = _chainId;
    usedChain.testnetChainId = _chainId;
  }

  if (data && (0 != data.indexOf('0x'))) {
    data = '0x' + data;
  }

  value = web3.utils.toWei(value, 'ether');
  value = new web3.utils.BN(value);
  value = '0x' + value.toString(16);

  gasPrice = new BigNumber(gasPrice);
  gasPrice = '0x' + gasPrice.toString(16);

  gasLimit = new BigNumber(gasLimit);
  gasLimit = '0x' + gasLimit.toString(16);

  let from = await path2Address(chain, walletId, path);
  // tool.logger.info("%s serializeTx address: %O", chain, from);

  let chainId = wanUtil.isOnMainNet()? usedChain.mainnetChainId : usedChain.testnetChainId;

  let tx = {
    commonData: {nonce, gasPrice, gasLimit, to, value, from, chainId},
    contractData: data
  };
  if (chain == 'WAN') {
    tx.commonData.Txtype = 0x01; // wanchain only
  }
  // tool.logger.info("%s serializeTx: %O", chain, tx);
  let Signer = usedChain.signer;
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
  if (chain !== 'WAN') {
    chain = 'ETH';
  }
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