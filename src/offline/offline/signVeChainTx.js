const scTool = require('../utils/veChainScTool');

/*
  tx struct: {
    chain: required, VET
    chainId: required, as chainTag, mainnet: 0x4a，testnet: 0x27
    from: required, sender address
    to: required, contract address or normal address to receive coin
    abi: required for contract tx
    params: optional, default is []
    value: optional, default is 0
    gasPrice: optional, as gasPriceCoef, default is 0
    gasLimit: required, as gas 
    refBlock: required, as blockRef, first 8 bytes of block id, eg. '0x014d38287c2476ba'
    expiration: optional, default is 10000
  }
*/

async function signVeChainTx(tx) {
  let chain = tx.chain;
  let chainId = parseInt(tx.chainId);
  let from = tx.from.toLowerCase();
  let to = tx.to.toLowerCase();
  let value = tx.value || '0';
  let gasPriceCoef = tx.gasPrice || 0;
  let expiration = tx.expiration || 10000; // 10 seconds per block, total about 27 hours, too big number may be rejected by nodes
  let clauses = scTool.buildTxData(chain, to, tx.abi, tx.params || [], value);
  let signedData = await scTool.serializeTx(chain, chainId, clauses, from, gasPriceCoef, tx.gasLimit, tx.refBlock, expiration, tx._wallet);
  return signedData;
}

module.exports = signVeChainTx;