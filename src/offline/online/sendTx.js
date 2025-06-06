const sendEvmTx = require('./sendEvmTx');
const sendTronTx = require('./sendTronTx');
const sendVeChainTx = require('./sendVeChainTx');

async function sendTx(txs) {
  // console.log({dataPath, txs})
  let i = 0;
  try {
    for (; i < txs.length; i++) {
      let tx = txs[i];
      let chain = tx.chain;
      let success = false;
      switch (chain) {
        case "TRX":
          success = await sendTronTx(tx);
          break;
        case "VET":
          success = await sendVeChainTx(tx);
          break;
        default:
          success = await sendEvmTx(tx);
          break;
      }
      if (success) {
        console.log("%s send tx %d(%s) to %s success", chain, i + 1, tx.abi? tx.abi.name : "transfer", tx.to);
      } else {
        console.error("%s send tx %d(%s) to %s failed", chain, i + 1, tx.abi? tx.abi.name : "transfer", tx.to);
        break;
      }
    }
  } catch (e) {
    console.error("send txs failed: %O", e);
  }
  return [i, txs.length];
}

module.exports = sendTx;