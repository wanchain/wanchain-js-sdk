/**
 * HD wallet DB
 *
 * Copyright (c) wanchain, all rights reversed
 */

"use strict";

const path = require('path');
const low = require('lowdb');
const wanStorage = require('./wanStorage');
const config = require('../conf/config');
let Wandb = require('./wandb');

/**
 * model: {
 *     wallet : [
 *        {
 *            chain : string,
 *            chainID: number,
 *            rootPath: string,
 *            lastScaned : {
 *                account: number,
 *                index  : number
 *            },
 *            lastUsed : {
 *                account : index,
 *            }
 *        }
 *     ],
 *     mnemonic : [
 *         {
 *             id : number,
 *             mnemonic : string,
 *             exported : true|false
 *         }
 *     ]
 * }
 */
const dbModel = {
    "name" : "hdwallet",
    "dbVersion" : "1.0.0",
    "walletVersion":  "1.0.0",
    "net": "",
    "wallet": [
    ],
    "mnemonic": [
    ]
};

const MnemonicKey = "mnemonic";
const WalletKey   = "wallet";

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
  
    updateOriginDb() {
        /**
         * Prevent base class to update DB 
         */
    }
  
    /**
     * Mnemonic operations
     */ 
    hasMnemonic() {
        return this.db.get(`${MnemonicKey}`).size().value() > 0;
    }
 
    /**
     */ 
    addMnemonic(mnemonic) {
        if (!mnemonic || typeof mnemonic !== 'object') {
            // Throw an error
            throw new Error('Invalid parameter');
        }
  
        if (!mnemonic.hasOwnProperty('id')) {
            let id = this.db.get(`${MnemonicKey}`).size().value() + 1;
            mnemonic['id'] = id;
        }
  
        if (this.db.get(`${MnemonicKey}`).find({'id':mnemonic['id']}).value() != null) {
            throw new Error('Duplicated record');
        }
  
        this.db.get(`${MnemonicKey}`).push(mnemonic).write();
    }
 
    /**
     */ 
    getMnemonic(id) {
        if (!id || typeof id !== 'number') {
            throw new Error('Invalid parameter');
        }
  
        return this.db.get(`${MnemonicKey}`).find({'id':id}).value();
    }
  
    deleteMnemonic(id) {
        if (!id || typeof id !== 'number') {
            throw new Error('Invalid parameter');
        }
        this.db.get(`${MnemonicKey}`).remove({'id':id}).write();
    }
  
    updateMnemonic(id, mnemonic) {
        if (!id || !mnemonic || typeof id !== 'number' || typeof mnemonic !== 'object') {
            // Throw an error
            throw new Error('Invalid parameter');
        }
  
        this.db.get(`${MnemonicKey}`).find({'id':id}).assign(mnemonic).write();
    }
  
    /**
     */ 
    size() {
        return this.db.get(`${WalletKey}`).size().value();
    }
  
    /**
     */
    insert(record) {
        if (!record || typeof record !== 'object' || !record.hasOwnProperty("chainID")) {
            // Throw an error
            throw new Error('Invalid parameter');
        }
  
        if (this.db.get(`${WalletKey}`).find({"chainID":record["chainID"]}).value() != null) {
            throw new Error('Duplicated record');
        }
  
        this.db.get(`${WalletKey}`).push(record).write();
    }
  
    /**
     */
    delete(chain) {
        if (!chain || typeof chain !== 'number') {
            throw new Error('Invalid parameter');
        }
        this.db.get(`${WalletKey}`).remove({"chainID":chain}).write();
    }
  
    /**
     */
    update(chain, record) {
      if (!chain || !record || typeof chain !== 'number' || typeof record !== 'object') {
          // Throw an error
          throw new Error('Invalid parameter');
      }
  
      this.db.get(`{WalletKey}`).find({"chainID":chain}).assign(record).write();
    }
  
    /**
     */  
    read(chain) {
      if (!chain || typeof chain !== 'number') {
          throw new Error('Invalid parameter');
      }

      return this.db.get(`${WalletKey}`).find({'chainID':chain}).value();
    }
}

module.exports = HDWalletDB;
