'use strict'
let     DataSign    = require('../common/DataSign');
let     ccUtil      = require('../../../api/ccUtil');
let     utils       = require('../../../util/util');

let logger = utils.getLogger('XrpDataSign.js');

/**
 * class use to sign transaction
 * @class
 * @augments  DataSign
 *
 */
class XrpDataSign extends DataSign {
  /**
   * @constructor
   * @param {Object} input  - {@link CrossChain#input input} of final users.(gas, gasPrice, value and so on)
   * @param {Object} config - {@link CrossChain#config config} of cross chain used.
   */
  constructor(input, config) {
    super(input, config);
  }

  /**
   * sign data
   * @override
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  async sign(tran) {
    logger.debug("Entering XrpDataSign::sign");

    let walletID = parseInt(this.input.walletID) || 1;
    // let trans = tran.contractData;
    if (this.input.hasOwnProperty('BIP44Path')) {
        // Use HD wallet
        let fromAddr;
        let xrpChn = global.chainManager.getChain('XRP');
        if (this.input.from && (typeof this.input.from === 'object')) {
          let chain = global.chainManager.getChain(this.input.chainType);
          fromAddr = await chain.getAddress(this.input.from.walletID, this.input.from.path);
          this.input.BIP44Path = this.input.from.path
        } else {
          fromAddr = {
            address: this.input.from
          }
        }
        if (!xrpChn) {
            throw new Error("Something goes wrong, we don't have XRP registered");
        }
        let opt = utils.constructWalletOpt(walletID, this.input.password);
        let packedTx = await ccUtil.packTransaction('XRP', { address: fromAddr.address, payment: this.input.payment });
        if (packedTx && packedTx.txJSON) {
          let txJSONParse = JSON.parse(packedTx.txJSON)
          this.input.LastLedgerSequence = txJSONParse.LastLedgerSequence;
        }
        let signedTx = await xrpChn.signTransaction(walletID, packedTx, this.input.BIP44Path, opt);
        this.retResult.code = true;
        this.retResult.result = signedTx;
    }
    return this.retResult;
  }


}

module.exports = XrpDataSign;
