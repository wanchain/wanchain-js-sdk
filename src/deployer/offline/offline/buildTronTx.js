const tool = require('../utils/tool');
const scTool = require('../utils/tronScTool');

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

async function buildTronTx(tx) {
  let chain = tx.chain;
  let from = tx.from;
  let to = tx.to;
  let params = tx.params || [];
  let txData = '';
  if (tx.abi) { // contract tx, otherwise is transfer coin
    txData = scTool.buildScTxData(chain, to, tx.abi, params);
  }
  let value = tx.value || 0;
  let expiration = tx.expiration || 1440;
  let signedData = await scTool.serializeTx(chain, txData, from, to, value, tx.feeLimit, tx.refBlock, expiration, tx._wallet);
  return signedData;
}

module.exports = buildTronTx;