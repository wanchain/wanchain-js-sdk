"use strict";

const path = require('path');
const low = require('lowdb');
const fs = require('graceful-fs');
const wanStorage = require('./wanStorage');
const config = require('../conf/config');
let Wandb = require('./wandb');

const dbModel = {
    "name" : "btcwallet",
    "dbVersion" : "1.0.0",
    "walletVersion":  "1.0.0",
    "net": "",
    "collections": {
        "data" : [
        ]
    },
    "btcAddrModel" : {
        "address" : "",
        "encryptedKey" : ""
    }
};

/**
 * @class
 * BTC wallet DB
 */
class BTCWalletDB extends Wandb {
  /**
   * @constructor
   * @param {string} path - The file path, this file path is used to file db.
   * @param {string} net  - It used to describe the testnet db and main net db.
   */
  constructor(path, net) {
    super(path, net, dbModel);
    this.filePath = `${path}/${dbModel.name}_${net}.db`;
  }

  /**
   * TODO: to upgrade previous BTC wallet 
   */ 
  updateOriginDb(filePath, dbModel = dbModel) {
    let originDb = JSON.parse(fs.readFileSync(filePath));

    for (let key in dbModel) {
      if (!originDb[key]) {
        originDb[key] = dbModel[key];
      }
    }
    fs.writeFileSync(filePath, JSON.stringify(originDb, null, 2), "utf8");
  }

  /**
   */
  insertAddress(addr) {
    this.db.get(`collections.${config.btcWalletCollection}`).push(addr).write();
  }

  /**
   */  
  getAddresses() {
    return this.db.get(`collections.${config.btcWalletCollection}`).cloneDeep().value();
  }
}

module.exports = BTCWalletDB;
