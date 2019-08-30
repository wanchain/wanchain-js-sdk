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
let Wandb = require('./wandb');

/**
 * model: {
 *   "name" : "wanOTA",
 *   "dbVersion" : "1.0.0",
 *   "net": "",
 *   "acctInfo" : [
 *       {
 *           "acctID" : ""
 *           "scaned" : {
 *               "begin" : 0,
 *               "end" : 0
 *           }
 *       }
 *   ],
 *   "usrOTA": [
 *       {
 *           "txhash"   : "",
 *           "toOTA"    : "",
 *           "toAcctID" : "",
 *           "value"    : 0,
 *           "from"     : "",
 *           "blockNo"  : 0,
 *           "state"    : "",
 *           "timestamp": ""
 *       }
 *   ],
 *   "otaData": [
 *       {
 *           "hash" : "",
 *           "blockNumber": "",
 *           "to" : "",
 *           "from" : "",
 *           "input" : "",
 *       }
 *   ]
 * }
 */

const dbModel = {
    "name" : "wanOTA",
    "dbVersion" : "1.0.0",
    "net": "",
    "acctInfo" : [
    ],
    "usrOTA": [
    ],
    "otaData" : [
    ]
};

/**
 * @class
 * HD wallet DB to store mnemonic
 */
class WanOTADB extends Wandb {
    /**
     * @constructor
     * @param {string} path - The file path, this file path is used to file db.
     * @param {string} net  - It used to describe the testnet db and main net db.
     */
    constructor(path, net) {
        super(path, net, dbModel);
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
        this._usrTbl = new DBTable(this.db, "usrOTA", "txhash");
        this._acctTbl= new DBTable(this.db, "acctInfo", "acctID");
        this._otaTbl= new DBTable(this.db, "otaData", "hash");
    }

    getAcctTable() {
        return this._acctTbl;
    }

    getOTATable() {
        return this._otaTbl;
    }

    getUsrOTATable() {
        return this._usrTbl;
    }
}

module.exports = WanOTADB;
