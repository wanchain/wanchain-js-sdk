/**
 */
'use strict'

const wanUtil = require('../../util/util');
const ethUtil = require('ethereumjs-util');

class EthRawTx {
  constructor (data) {
    data = data || {}

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
      allowZero: true,
      default: new Buffer([])
    }]

    ethUtil.defineProperties(this, fields, data)
  }

}

class WanRawTx {
    constructor (data) {
        const fields = [{
            name : 'Txtype',
            length:32,
            allowLess:true,
            default: new Buffer([])
        },{
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
            allowZero: true,
            default: new Buffer([])
        }, {
            name: 'chainId',
            length: 32,
            allowLess: true,
            default: new Buffer([0x01])
        }, {
            name: 'dumb1',
            length: 32,
            allowLess: true,
            allowZero: false,
            default: new Buffer([0x00])
        }, {
            name: 'dumb2',
            length: 32,
            allowLess: true,
            allowZero: false,
            default: new Buffer([0x00])
        }]

        ethUtil.defineProperties(this, fields, data)
    }
}

module.exports = {
    EthRawTx,
    WanRawTx
}

