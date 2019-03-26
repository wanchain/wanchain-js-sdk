/**
 * HD wallet DB
 *
 * Licensed under MIT.
 * Copyright (c) wanchain 2019, all rights reversed
 */

"use strict";

const path = require('path');
const low = require('lowdb');
const wanStorage = require('./wanStorage');
const DBTable = require('./table');
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
 *     ],
 *     rawKey : [
 *         {
 *             chainID : chain,
 *             count : number,
 *             keys : {
 *             }
 *         }
 *     ],
 *     keystore : [
 *         {
 *             chainID : chain,
 *             keystores : {
 *             }
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
    ],
    "rawKey" : [
    ],
    "keystore" : [
    ]
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
        let fn = `${path}/${dbModel.name}.json`;
        super(path, net, dbModel, fn);
        this._initTables();
    }
  
    updateOriginDb() {
        /**
         * Prevent base class to update DB 
         */
    }

    _initTables() {
        this._mnemonicTbl = new DBTable(this.db, "mnemonic", "id");
        this._walletTbl   = new DBTable(this.db, "wallet", "chainID");
        this._privKeyTbl  = new DBTable(this.db, "rawKey", "chainID");
        this._keyStoreTbl = new DBTable(this.db, "keystore", "chainID");
    }
  
    getMnemonicTable() {
        return this._mnemonicTbl;
    }

    getWalletTable() {
        return this._walletTbl;
    }

    getRawKeyTable() {
        return this._privKeyTbl;
    }

    getKeyStoreTable() {
        return this._keyStoreTbl;
    }
}

module.exports = HDWalletDB;
