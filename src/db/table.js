/**
 * HD wallet DB
 *
 * Licensed under MIT.
 * Copyright (c) wanchain 2019, all rights reversed
 */

"use strict";

const error = require('../api/error');

/**
 * model: {
 *     table1 : [
 *        {
 *             key: record1,
 *             ...
 *        },
 *        ...
 *     ],
 *     table2 : [
 *         {
 *             key : record1,
 *             ...
 *         },
 *         ...
 *     ]
 * }
 */

/**
 * @class
 *
 * This simulates table operation in LOWDB
 */
class DBTable {
    /**
     * @constructor
     *
     * @param {db} lowdb instance
     * @param {column} string, table name
     * @param {key} string, the key in record to uniquely identify the record
     */
    constructor(db, column, key) {
        this._db = db;
        this._column = column;
        this._key    = key;
    }

    /**
     * Return length of table
     */
    size() {
        return this._db.get(`${this._column}`).size().value();
    }

    /**
     * Insert a record, the record must have 'key' in itself.
     */
    insert(record) {
        if (!record || typeof record !== 'object' || !record.hasOwnProperty(this._key)) {
            // Throw an error
            throw new error.InvalidParameter('Invalid parameter');
        }

        // TODO:
        let value = record[this._key];

        if (this._db.get(`${this._column}`).find({[this._key]:value}).value() != null) {
            throw new error.DuplicateRecord('Duplicated record');
        }

        this._db.get(`${this._column}`).push(record).write();
    }

    /**
     * Delete a record identified by id
     */
    delete(id) {
        if (id === null || id === undefined) {
            throw new error.InvalidParameter('Invalid parameter');
        }
        this._db.get(`${this._column}`).remove({[this._key]:id}).write();
    }

    /**
     * Update a record identified by id, the new record must have 'key'.
     */
    update(id, record) {
      if (id === null || id === undefined ||
          !record || typeof record !== 'object' || !record.hasOwnProperty(this._key)) {
          // Throw an error
          throw new error.InvalidParameter('Invalid parameter');
      }

      this._db.get(`${this._column}`).find({[this._key]:id}).assign(record).write();
    }

    /**
     * Read a record identified by id
     */
    read(id) {
      if (id === null || id === undefined) {
          throw new error.InvalidParameter('Invalid parameter');
      }

      return this._db.get(`${this._column}`).find({[this._key]:id}).value();
    }

    /**
     * truncte table
     */
    truncate() {
      this._db.set(`${this._column}`, []).write();
    }

    /**
     * Filter the records.
     *
     * @param {f} function - signature (record)=>bool
     * @return {array}
     */
    filter(f) {
        let r = this._db.get(`${this._column}`).value();
        if (typeof f === 'function') {
            let v=[]
            for (let i=0; i<r.length; i++) {
                if (f(r[i])) {
                    //
                    v.push(r[i]);
                }
            }

            return v;
        }
        return r;
    }
}

module.exports = DBTable;
