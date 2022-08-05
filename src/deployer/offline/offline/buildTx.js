const buildEvmTx = require('./buildEvmTx');
const buildTronTx = require('./buildTronTx');

async function buildTx(chain, walletId, path, txs) {
  let result = false;
  switch (chain) {
    case "Tron":
      result = await buildTronTx(chain, walletId, path, txs);
      break;
    default:
      result = await buildEvmTx(chain, walletId, path, txs);
      break;
  }
  return result;
}

module.exports = buildTx;