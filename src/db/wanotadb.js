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
 *   "otaRecords": [
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
 *   ]
 * }
 */

const dbModel = {
    "name" : "wanOTA",
    "dbVersion" : "1.0.0",
    "net": "",
    "acctInfo" : [
    ],
    "otaRecords": [
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

    _initTables() {
        this._otaTbl = new DBTable(this.db, "otaRecords", "txhash");
        this._acctTbl= new DBTable(this.db, "acctInfo", "acctID");
    }

    getAcctTable() {
        return this._acctTbl;
    }

    getOTATable() {
        return this._otaTbl;
    }
}

module.exports = WanOTADB;
