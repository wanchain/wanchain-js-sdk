/**
 * OTA storage
 *
 * Copyright (c)2019, all rights reserved.
 */
'use strict'

const error = require('../api/error');
const DBTable = require('./table');

const OTAKey = "addr";
const VALKey = "value";

class OTAStorage {
    //
    constructor(db, colota, colval) {
        //
        this._db = db;
        this._ota = new DBTable(db, colota, OTAKey);
        this._val = new DBTable(db, colval, VALKey);
    }

    addOTAIfNotExist(otaAddr, value) {
        //
        let otarec = {
            [OTAKey]: otaAddr,
            value: value
        };

        // will throw error if duplicate
        this._ota.insert(otarec);

        let valrec = this._val.read(value);
        if (!valrec) {
            // not found
            valrec = {
                [VALKey]: value,
                "otas": [otaAddr]
            }

            this._val.insert(valrec);
        } else {
            valrec.otas.push(otaAddr);
            this._val.update(value, valrec);
        }

    }

    getOTAMixSet(addr, size) {
        //
        if (size <= 0) {
            throw new error.InvalidParameter(`Get OTA mixture, invalid size : ${size}`);
        }
        let ota = this._ota.read(addr);
        if (!ota) {
            // error
            throw new error.NotFound(`OTA address not found: ${addr}`);
        }
        let val = this._val.read(ota.value);
        if (!val) {
            //
            throw new error.LogicError(`Value not exist for ota address: ${addr}`);
        }

        let addrs = [];
        let m = val.otas.length;

        if (m < size) {
            throw new error.NotFound(`Insufficient address for mixture set, value=${val}`);
        }

        while (m && size) {
            let i = Math.floor(Math.random() * m--);
            let t = val.otas[m];
            val.otas[m] = val.otas[i];
            val.otas[i] = t;

            addrs.push(val.otas[m]);
            size--;
        }

        return addrs;
    }
};

module.exports = OTAStorage;
