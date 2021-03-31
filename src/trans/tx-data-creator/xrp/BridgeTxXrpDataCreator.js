const utils = require('../../../util/util');
const ccUtil = require('../../../api/ccUtil');
const TxDataCreator = require('../common/TxDataCreator');
const logger = utils.getLogger('BridgeTxXrpDataCreator.js');

class BridgeTxXrpDataCreator extends TxDataCreator {
  constructor(input, config) {
    super(input, config);
  }

  /* New implementation */
  async createCommonData() {
    logger.debug("Entering BridgeTxXrpDataCreator::createCommonData");
    let fromAddr, toAddr;
    const {
      to,
      from,
      chainType,
      smgXrpAddr,
      tokenPairID,
      networkFee
    } = this.input;

    let x = ccUtil.generatePrivateKey();
    let hashX = ccUtil.getSha256HashKey(x);

    this.input.x = x;
    this.input.hashX = hashX;

    if (from && (typeof from === 'object')) {
      let chain = global.chainManager.getChain(chainType);
      fromAddr = await chain.getAddress(from.walletID, from.path);
      utils.addBIP44Param(this.input, from.walletID, from.path);
    } else {
      fromAddr = {
        address: this.input.from.toLowerCase()
      }
    }

    if (to && (typeof to === 'object')) {
      let chain = global.chainManager.getChain(this.config.dstChainType);
      toAddr = await chain.getAddress(to.walletID, to.path);
    } else {
      toAddr = {
        address: this.input.to.toLowerCase()
      }
    }

    let commData = {
      "from": fromAddr.address,
      "to": smgXrpAddr,
      "value": this.input.value,
      "wanAddress": toAddr.address.startsWith('0x') ? toAddr.address : `0x${toAddr.address}`,
    };
    let value = utils.toBigNumber(this.input.value).times('1e' + 6).trunc();
    this.input.value = Number(value);
    logger.info(`Transfer amount [${this.input.value}]`);
    this.input.payment = ccUtil.getXrpPayment({ from: fromAddr.address, to: smgXrpAddr, value, smgXrpAddr, wanAddress: toAddr.address, tokenPairID, networkFee })
    this.retResult.code = true;
    this.retResult.result = commData;

    logger.debug("BridgeTxXrpDataCreator::createCommonData is completed");

    return Promise.resolve(this.retResult);
  }
}

module.exports = BridgeTxXrpDataCreator;