const signEvmTx = require('./signEvmTx');
const signTronTx = require('./signTronTx');
const signVeChainTx = require('./signVeChainTx');
const tool = require('../utils/tool');

async function signTx(txs) {
  try {
    let txsOut = txs.map(tx => Object.assign({}, tx));
    for (let i = 0; i < txsOut.length; i++) {
      let tx = txsOut[i];
      switch (tx.chain) {
        case "TRX":
          tx.signedTx = await signTronTx(tx);
          break;
        case "VET":
          tx.signedTx = await signVeChainTx(tx);
          break;
        default:
          tx.signedTx = await signEvmTx(tx);
          break;        
      }
      if (tx.signedTx) {
        console.log("tx %d/%d %s signedTx: %s", i, txs.length, tx.chain, tx.signedTx);
      } else {
        throw new Error("not signed");
      }
    }
    txsOut.forEach(tx => delete tx._wallet);
    let result = JSON.stringify(txsOut);
    tool.logger.info("build %d txs success", txsOut.length);
    return result;
  } catch (e) {
    tool.logger.error("build txs failed: %O", e);
    return "";
  }
}

module.exports = signTx;