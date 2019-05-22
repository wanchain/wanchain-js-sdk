'use strict'
let     DataSign    = require('../common/DataSign');
// let     ccUtil      = require('../../../api/ccUtil');
let     utils       = require('../../../util/util');

let logger = utils.getLogger('EosDataSign.js');

/**
 * class use to sign transaction
 * @class
 * @augments  DataSign
 *
 */
class EosDataSign extends DataSign {
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
    logger.debug("Entering EosDataSign::sign");

    let walletID = parseInt(this.input.walletID) || 1;
    let trans = tran.contractData;

    if (this.input.hasOwnProperty('BIP44Path')) {
        // Use HD wallet
        let eosChn = global.chainManager.getChain('EOS');
        if (!eosChn) {
            // Ops, it's awkward
            throw new Error("Something goes wrong, we don't have EOS registered");
        }

        let opt = utils.constructWalletOpt(walletID, this.input.password);
        let signedTx = await eosChn.signTransaction(walletID, trans, this.input.BIP44Path, opt);

        this.retResult.code = true;
        this.retResult.result = signedTx;
    }
    return this.retResult;
  }


}

module.exports = EosDataSign;
