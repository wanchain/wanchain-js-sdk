/**
 */
'use strict'

const wanUtil = require('../../util/util');
const ethUtil = require('ethereumjs-util');

const logger = wanUtil.getLogger("ethtx.js");

class EthTransaction {
  constructor (data, opts) {
    opts = opts || {}

    data = data || {}

    logger.info("New ETH TX: ", JSON.stringify(data, null, 4));
    // Define Properties
    const fields = [{
      name: 'nonce',
      length: 32,
      allowLess: true,
      default: new Buffer([])
    }, {
      name: 'gasPrice',
      length: 32,
      allowLess: true,
      default: new Buffer([])
    }, {
      name: 'gasLimit',
      alias: 'gas',
      length: 32,
      allowLess: true,
      default: new Buffer([])
    }, {
      name: 'to',
      allowZero: true,
      length: 20,
      default: new Buffer([])
    }, {
      name: 'value',
      length: 32,
      allowLess: true,
      default: new Buffer([])
    }, {
      name: 'data',
      alias: 'input',
      allowEmpty: true
      //default: new Buffer([])
    }]

    /**
     * Returns the rlp encoding of the transaction
     * @method serialize
     * @return {Buffer}
     * @memberof Transaction
     * @name serialize
     * @see {@link https://github.com/ethereumjs/ethereumjs-util/blob/master/docs/index.md#defineproperties|ethereumjs-util}
     */
    /**
     * Returns the transaction in JSON format
     * @method toJSON
     * @return {Array | String}
     * @memberof Transaction
     * @name toJSON
     * @see {@link https://github.com/ethereumjs/ethereumjs-util/blob/master/docs/index.md#defineproperties|ethereumjs-util}
     */
    // attached serialize
    ethUtil.defineProperties(this, fields, data)

    /**
     * @property {Buffer} from (read only) sender address of this transaction, mathematically derived from other parameters.
     * @name from
     * @memberof Transaction
     */
  }

}

module.exports = EthTransaction;

