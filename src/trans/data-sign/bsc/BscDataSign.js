'use strict'
let     DataSign    = require('../common/DataSign');
let     ccUtil      = require('../../../api/ccUtil');
let     utils       = require('../../../util/util');

let logger = utils.getLogger('BscDataSign.js');

/**
 * @class
 * @augments DataSign
 */
class BscDataSign extends DataSign {
  /**
   * @constructor
   * @param {Object} input  - {@link CrossChain#input input} of final users.(gas, gasPrice, value and so on)
   * @param {Object} config - {@link CrossChain#config config} of cross chain used.
   */
  constructor(input, config) {
    super(input, config);
  }

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  async sign(tran) {
    logger.debug("Entering BscDataSign::sign");

    let walletID = this.input.walletID || 1;
    let trans = tran.commonData;
    trans.data = tran.contractData;

    if (this.input.hasOwnProperty('BIP44Path')) {
        // Use HD wallet
        let bscChn = global.chainManager.getChain('BNB');
        if (!bscChn) {
            // Ops, it's awkward 
            throw new Error("Something goes wrong, we don't have BNB registered");
        }

        let opt = utils.constructWalletOpt(walletID, this.input.password);
        let signedTx = await bscChn.signTransaction(walletID, trans, this.input.BIP44Path, opt);

        this.retResult.code = true;
        this.retResult.result = '0x' + signedTx.toString('hex');;
    } else {
        logger.debug("Sign by private key...");
        let privateKey = ccUtil.getPrivateKey(
          tran.commonData.from,
          this.input.password,
          this.input.keystorePath);

        let rawTx = ccUtil.signEthByPrivateKey(trans, privateKey);

        this.retResult.code = true;
        this.retResult.result = rawTx;
    }
    return this.retResult;
  }


}

module.exports = BscDataSign;
