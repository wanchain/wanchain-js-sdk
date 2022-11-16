const tool = require('./tool');
const Web3 = require('web3');
const {Client} = require("@tronscan/client");
const TronWeb = require('tronweb');

const fullNode = 'https://api.nileex.io';
const solidityNode = 'https://api.nileex.io';
const eventServer = 'https://api.nileex.io';
const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, '');

const web3 = new Web3();
const client = new Client();

function buildScTxData(chain, to, abi, params) {
  to = base58Address2Hex(to, true);
  let contract = new web3.eth.Contract([abi], to);
  return contract.methods[abi.name](...params).encodeABI();
}

const serializeTx = async (chain, data, from, to, value, feeLimit, refBlock, expiration, wallet) => {
  if (0 === data.indexOf('0x')) {
    data = data.substr(2);
  }
  value = value * (10 ** 6);
  feeLimit = feeLimit * (10 ** 6);
  let walletAdrr = await path2Address(chain, wallet.id, wallet.path);
  if (!tool.cmpAddress(from, walletAdrr)) {
    console.error("%s wallet not match from address: %s != %s", chain, walletAdrr, from);
    throw new Error("wallet not match from address");
  }
  let tx;
  if (data) { // contract tx
    let txValue = {
      owner_address: base58Address2Hex(from),
      contract_address: base58Address2Hex(to),
      call_value: value,
      data
    };
    // tool.logger.info("%s serializeTx: %O", chain, {txValue, refBlock, expiration});
    tx = await client.getTriggerSmartContractTransaction(txValue);
  } else { // send trx tx
    tx = await client.getTransferTransaction(from, to, value);
  }
  let sk = await path2Sk(chain, wallet.id, wallet.path);
  let signedTx = await client.offlineSignTransaction(sk, tx, feeLimit, refBlock, expiration);
  return signedTx;
}

const sendSerializedTx = async (chain, tx) => {
  let result = await tronWeb.trx.sendHexTransaction(tx);
  let txHash = result.txid;
  tool.logger.info("%s sendSerializedTx hash: %s", chain, txHash);
  return txHash;
}

const waitReceipt = (chain, txHash, timedout = 180000) => {
  const handler = function(resolve, reject) {
    tronWeb.trx.getConfirmedTransaction(txHash, (error, receipt) => {
      // console.log("tx %s receipt: %O", txHash, receipt)
      if (error || (!receipt) || (!receipt.ret) || (!receipt.ret[0].contractRet)) {
        timedout -= 2000;
        if (timedout > 0) {
          setTimeout(() => handler(resolve, reject), 2000);
        } else {
          tool.logger.error("%s tx %s receipt failed", chain, txHash);
          return resolve(false);
        }
      } else {
        // console.log("waitTxReceipt: %O", receipt);
        if (receipt.ret[0].contractRet === "SUCCESS") {
          return resolve(true);
        } else {
          return resolve(false);
        }
      }
    });
  }
  return new Promise(handler);
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