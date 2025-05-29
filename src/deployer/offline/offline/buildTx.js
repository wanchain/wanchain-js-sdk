const buildEvmTx = require('./buildEvmTx');
const buildTronTx = require('./buildTronTx');
const buildVeChainTx = require('./buildVeChainTx');
const tool = require('../utils/tool');

async function buildTx(txs) {
  try {
    let txsOut = txs.map(tx => Object.assign({}, tx));
    for (let i = 0; i < txsOut.length; i++) {
      let tx = txsOut[i];
      switch (tx.chain) {
        case "TRX":
          tx.signedTx = await buildTronTx(tx);
          break;
        case "VET":
          tx.signedTx = await buildVeChainTx(tx);
          break;
        default:
          tx.signedTx = await buildEvmTx(tx);
          break;        
      }
      if (tx.signedTx) {
        console.log("tx %d/%d %s signedTx: %s", i, txs.length, tx.chain, tx.signedTx);
      } else {
        throw new Error("not signed");
      }
    }
    txsOut.forEach(tx => delete tx._wallet);
    let filePath = tool.getOutputPath('sendTx');
    tool.write2file(filePath, JSON.stringify(txsOut));
    tool.logger.info("build %d txs success and saved to file: %s", txsOut.length, filePath);
    return true;
  } catch (e) {
    tool.logger.error("build txs failed: %O", e);
    return false;
  }
}

module.exports = buildTx;