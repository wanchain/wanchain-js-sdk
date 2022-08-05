const sendEvmTx = require('./sendEvmTx');
const sendTronTx = require('./sendTronTx');

async function sendTx(chain) {
  let result = false;
  switch (chain) {
    case "Tron":
      result = await sendTronTx(chain);
      break;
    default:
      result = await sendEvmTx(chain);
      break;
  }
  return result;
}

module.exports = sendTx;