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
const otaState = require('./otaStorage');
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
 *   ],
 *   "ota2val" : [
 *       {
 *           "addr"  : "",
 *           "value" : 10
 *       }
 *   ],
 *   "val2ota" : [
 *       {
 *           "value" : 10,
 *           "otas" : []
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
    ],
    "ota2val" : [
    ],
    "val2ota" : [
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

    updateOriginDb(filePath, model = dbModel) {
        let originDb = JSON.parse(fs.readFileSync(filePath));
        for (let key in model) {
          if (!originDb[key]) {
            originDb[key] = model[key];
          }
        }
        fs.writeFileSync(filePath, JSON.stringify(originDb, null, 2), "utf8");
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
        this._otaSta= new otaState(this.db, "ota2val", "val2ota");
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

    getOTAStorage() {
        return this._otaSta;
    }
}

module.exports = WanOTADB;
