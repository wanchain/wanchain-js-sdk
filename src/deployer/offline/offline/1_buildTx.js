const cfg = require('../config.json');
const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

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

async function buildTx(chain, walletId, path, txs) {
  let output = [];

  try {
    let sender = await scTool.path2Address(chain, walletId, path);
    sender = sender.toLowerCase();
    let nonce = tool.getNonce(chain, sender);

    for (let i = 0; i < txs.length; i++) {
      let tx = txs[i];
      let to = tx.toAddress.toLowerCase();
      let paras = tx.paras || [];
      let txData = '';
      if (tx.method && tx.abi) {
        txData = scTool.buildScTxData(chain, to, tx.abi, tx.method, paras);
      } else { // transfer coin
        tx.method = 'transfer';
      }
      let value = (tx.value)? tx.value.toString() : '0';
      let gasPrice = tx.gasPrice || cfg[chain].gasPrice;
      let gasLimit = tx.gasLimit || cfg[chain].gasLimit;
      let serialized = await scTool.serializeTx(chain, txData, nonce, to, value, walletId, path, gasPrice, gasLimit, tx.chainId);
      output.push({
        chain,
        toAddress: tx.toAddress,
        method: tx.method,
        sender,
        nonce,
        paras: paras,
        value: tx.value,
        data: serialized,
        gasPrice: gasPrice,
        gasLimit: gasLimit
      });
      nonce++;
    }

    let filePath = tool.getOutputPath(chain, 'sendTx', sender);
    tool.write2file(filePath, JSON.stringify(output));
    tool.logger.info("tx are serialized to %s", filePath);

    // update nonce
    tool.updateNonce(chain, sender, nonce);

    return true;
  } catch (e) {
    console.log('err', e);
    tool.logger.error("buildTxs failed: %O", e);
    return false;
  }
}

module.exports = buildTx;