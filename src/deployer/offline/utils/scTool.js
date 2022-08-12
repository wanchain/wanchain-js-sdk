const tool = require('./tool');
const Web3 = require('web3');
const ccUtil = require('../../../api/ccUtil');
const WanDataSign = require('../../../trans/data-sign/wan/WanDataSign');
const EthDataSign = require('../../../trans/data-sign/eth/EthDataSign');
const BigNumber = require('bignumber.js');

const web3 = new Web3();

function buildScTxData(chain, to, abi, params) {
  let contract = new web3.eth.Contract([abi], to);
  return contract.methods[abi.name](...params).encodeABI();
}

const serializeTx = async (chain, chainId, data, from, nonce, to, value, gasPrice, gasLimit, wallet) => {
  if (data && (0 !== data.indexOf('0x'))) {
    data = '0x' + data;
  }
  value = '0x' + new web3.utils.BN(web3.utils.toWei(value, 'ether')).toString(16);
  gasPrice = '0x' + new BigNumber(gasPrice).toString(16);
  gasLimit = '0x' + new BigNumber(gasLimit).toString(16);

  let walletAdrr = await path2Address(chain, wallet.id, wallet.path);
  if (!tool.cmpAddress(from, walletAdrr)) {
    console.error("%s wallet not match from address: %s != %s", chain, walletAdrr, from);
    throw new Error("wallet not match from address");
  }

  let tx = {
    commonData: {chainId, from, nonce, to, value, gasPrice, gasLimit},
    contractData: data
  };
  if (chain === 'WAN') {
    tx.commonData.Txtype = 0x01; // wanchain only
  }
  // tool.logger.info("%s serializeTx: %O", chain, tx);
  let Signer = (chain === 'WAN')? WanDataSign : EthDataSign;
  let signer = new Signer({walletID: wallet.id, BIP44Path: wallet.path});
  let signedTx = await signer.sign(tx);
  return signedTx.result;
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
    // tool.logger.error("%s tx %s waitReceipt seconds %d none: %O", chain, txHash, seconds, e);
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
  return ccUtil.hexAdd0x(addr.address);
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
  wan2win
}