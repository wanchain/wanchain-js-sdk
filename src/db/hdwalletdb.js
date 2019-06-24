/**
 * HD wallet DB
 *
 * Licensed under MIT.
 * Copyright (c) wanchain 2019, all rights reversed
 */

"use strict";

const path = require('path');
const low = require('lowdb');
const fs = require('fs');
const wanStorage = require('./wanStorage');
const DBTable = require('./table');
const error = require('../api/error');

let Wandb = require('./wandb');

/**
 * model: {
 *     user : [
 *        {
 *            chainID: string,
 *            accounts : {
 *                path : {
 *                    walletID : string
 *                }
 *            }
 *        }
 *     ],
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
    "user" : [
    ],
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

    /**
     * Delete entire database!
     */
    delete(password, chkfunc) {
        if (typeof password !== 'string' || typeof chkfunc !== 'function') {
            throw new error.InvalidParameter("Need 'password' when deleting database!")
        }

        if (!chkfunc(password)) {
            throw new error.WrongPassword("Deletion denied!")
        }

        let now = new Date().toISOString();
        let bakfile = `${this.filePath}.${now}`
        fs.renameSync(this.filePath, bakfile);

        this.db = null;
        this.tempdb = null;

        super.init(dbModel);
        this._initTables();
    }

    _initTables() {
        this._mnemonicTbl = new DBTable(this.db, "mnemonic", "id");
        this._walletTbl   = new DBTable(this.db, "wallet", "chainID");
        this._privKeyTbl  = new DBTable(this.db, "rawKey", "chainID");
        this._keyStoreTbl = new DBTable(this.db, "keystore", "chainID");
        this._usrTbl = new DBTable(this.db, "user", "chainID");
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

    getUserTable() {
        return this._usrTbl;
    }
}

module.exports = HDWalletDB;
