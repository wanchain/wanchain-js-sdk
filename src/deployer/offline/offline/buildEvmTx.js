const scTool = require('../utils/scTool');

/*
  tx struct: {
    chain: required, WAN or ETH
    to: required, contract address or normal address to receive coin
    abi: required for contract tx
    method: required for contract tx
    params: optional, default is []
    value: optional, default is 0
    gasPrice: optional, default is config.json
    gasLimit: optional, default is config.json
  }
*/

async function buildEvmTx(tx) {
  let chain = tx.chain;
  let from = tx.from.toLowerCase();
  let to = tx.to.toLowerCase();
  let params = tx.params || [];
  let chainId = parseInt(tx.chainId);
  let nonce = parseInt(tx.nonce);
  let txData = '';
  if (tx.abi) { // contract tx, otherwise is transfer coin
    txData = scTool.buildScTxData(chain, to, tx.abi, params);
  }
  let value = (tx.value || '0').toString();
  let signedData = await scTool.serializeTx(chain, chainId, txData, from, nonce, to, value, tx.gasPrice, tx.gasLimit, tx._wallet);
  return signedData;
}

module.exports = buildEvmTx;