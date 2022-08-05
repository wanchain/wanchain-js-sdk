const cfg = require('../config');
const tool = require('../utils/tool');
const scTool = require('../utils/tronScTool');

/*
  tx struct: {
    chain: required, WAN or ETH
    toAddress: required, contract address or normal address to receive coin
    abi: required for contract tx
    method: required for contract tx
    paras: optional, default is []
    value: optional, default is 0
    gasPrice: optional, default is config.json
    gasLimit: optional, default is config.json
  }
*/

async function buildTronTx(chain, walletId, path, txs) {
  let output = [];

  try {
    let sender = await scTool.path2Address(chain, walletId, path);
    for (let i = 0; i < txs.length; i++) {
      let tx = txs[i];
      let to = tx.toAddress;
      let paras = tx.paras || [];
      let txData = '';
      if (tx.method && tx.abi) {
        txData = scTool.buildScTxData(chain, to, tx.abi, tx.method, paras);
      } else {
        console.error("only support contract tx");
      }
      let value = tx.value || 0;
      let feeLimit = tx.feeLimit || cfg[chain].feeLimit;
      let context = tx.context || {};
      let serialized = await scTool.serializeTx(chain, txData, to, value, walletId, path, feeLimit, context);
      output.push({
        chain,
        toAddress: tx.toAddress,
        method: tx.method,
        sender,
        paras: paras,
        value: tx.value,
        data: serialized,
        feeLimit: feeLimit
      });
    }

    let filePath = tool.getOutputPath(chain, 'sendTx', sender);
    tool.write2file(filePath, JSON.stringify(output));
    tool.logger.info("%s chain %d txs are serialized to %s", chain, txs.length, filePath);
    return true;
  } catch (e) {
    tool.logger.error("build %s chain txs failed: %O", chain, e);
    return false;
  }
}

module.exports = buildTronTx;