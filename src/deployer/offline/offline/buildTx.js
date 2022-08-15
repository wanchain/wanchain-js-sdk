const buildEvmTx = require('./buildEvmTx');
const buildTronTx = require('./buildTronTx');
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
        default:
          tx.signedTx = await buildEvmTx(tx);
          break;        
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