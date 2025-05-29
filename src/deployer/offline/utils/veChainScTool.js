const tool = require('./tool');
const { ABIContract, Address, Clause, VET, Units, Transaction } = require('@vechain/sdk-core');
var Web3 = require('web3');

function buildTxData(chain, to, abi, params, value) {
  if (abi) {
    return [Clause.callFunction(
      Address.of(to),
      ABIContract.ofAbi([abi]).getFunction(abi.name),
      params,
      VET.of(value, Units.ether)
    )];
  } else {
    return [Clause.transferVET(
      Address.of(to),
      VET.of(value, Units.ether)
    )];
  }
}

const serializeTx = async (chain, chainId, clauses, from, gasPriceCoef, gasLimit, refBlock, expiration, wallet) => {
  let walletAdrr = await path2Address(chain, wallet.id, wallet.path);
  if (!tool.cmpAddress(from, walletAdrr)) {
    console.error("%s wallet not match from address: %s != %s", chain, walletAdrr, from);
    throw new Error("wallet not match from address");
  }
  let txBody = {
    chainTag: chainId,
    blockRef: refBlock,
    expiration,
    clauses,
    gas: gasLimit,
    gasPriceCoef,
    dependsOn: null,
    nonce: Math.floor(Date.now() / 1000) ^ Math.floor(Math.random() * 1000)
  };
  let tx = new Transaction(txBody);
  let sk = await path2Sk(chain, wallet.id, wallet.path);
  let signedTx = Buffer.from(tx.sign(sk).encoded).toString('hex');
  return signedTx;
}

const sendSerializedTx = async (chain, tx) => {
  let rpc = "https://rpc-testnet.vechain.energy";
  let web3 = new Web3(new Web3.providers.HttpProvider(rpc, { timeout: 30000, keepAlive: false }))
  let res = await web3.eth.sendSignedTransaction('0x' + tx);
  console.log("%s sendSerializedTx hash: %s", chain, res.transactionHash);
  return res.status;
}

const path2Address = async (chain, walletId, path) => {
  let chn = global.chainManager.getChain(chain);
  let addrInfo = await chn.getAddress(walletId, path);
  let addr = addrInfo.address;
  if (addr.substr(0, 2) !== '0x') {
    addr = '0x' + addr;
  }
  return addr;
}

const path2Sk = async (chain, walletId, path) => {
  let chn = global.chainManager.getChain(chain);
  let sk = await chn.getPrivateKeys(walletId, path);
  return sk[0];
}

module.exports = {
  buildTxData,
  serializeTx,
  sendSerializedTx,
  path2Address
}