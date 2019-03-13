"use strict";

const path = require('path');
const low = require('lowdb');
const wanStorage = require('./wanStorage');
const config = require('../conf/config');
let Wandb = require('./wandb');

const dbModel = {
    "name" : "hdwallet",
    "dbVersion" : "1.0.0",
    "walletVersion":  "1.0.0",
    "net": "",
    "collections": {
        "wallet" : [
        ]
    },
    "hdWalletModel" : {
        "id" : 0,
        "mnemonic" : "",
        "exported" : ""
    }
};

/**
 * @class
 * HD wallet DB to store mnemonic
 */
class HDWalletDB extends Wandb {
  /**
   * @constructor
   * @param {string} path - The file path, this file path is used to file db.
   * @param {string} net  - It used to describe the testnet db and main net db.
   */
  constructor(path, net) {
    super(path, net, dbModel);
  }

  /**
   */ 
  size() {
      return this.db.get(`collections.${config.hdWalletCollection}`).size().value();
  }

  /**
   */
  insert(wallet) {
    if (!wallet || typeof wallet !== 'object') {
        // Throw an error
        throw new Error('Invalid parameter');
    }

    if (!wallet.hasOwnProperty('id')) {
        let id = this.size() + 1;
        wallet['id'] = id;
    }

    if (this.db.get(`collections.${config.hdWalletCollection}`).find({'id':wallet['id']}).value() != null) {
        throw new Error('Duplicated record');
    }

    this.db.get(`collections.${config.hdWalletCollection}`).push(wallet).write();
  }

  /**
   */
  delete(id) {
    if (!id || typeof id !== 'number') {
        throw new Error('Invalid parameter');
    }
    this.db.get(`collections.${config.hdWalletCollection}`).remove({'id':id}).write();
  }

  /**
   */
  update(id, wallet) {
    if (!id || !wallet || typeof id !== 'number' || typeof wallet !== 'object') {
        // Throw an error
        throw new Error('Invalid parameter');
    }

    this.db.get(`collections.${config.hdWalletCollection}`).find({'id':id}).assign(wallet).write();
  }

  /**
   */  
  read(id) {
    if (!id || typeof id !== 'number') {
        throw new Error('Invalid parameter');
    }
    return this.db.get(`collections.${config.hdWalletCollection}`).find({'id':id}).value();
  }
}

module.exports = HDWalletDB;
