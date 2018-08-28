"use strict";

const path = require('path');
const low = require('lowdb');
const fs = require('graceful-fs');
const wanStorage = require('./wanStorage');

function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}

class wandb {
    constructor(path, dbModel) {
        this.db = null;
        this.tempdb = null;
        this.path = path;
        this.dbModel = dbModel;
        this.filePath = `${this.path}/${this.dbModel.name}.json`;
        // this.logDebug = global.getLogger('wanchaindb');
        this.init();
    }

    init() {
        let temp = this;
        // let logDebug = temp.logDebug;
        let filePath = temp.filePath;

        mkdirsSync(this.path);

        // if db file doesn't exist then create it
        try {
            // logDebug.debug(`Check that db exists and it's writeable: ${filePath}`);
            fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK);
            this.updateOriginDb(filePath, temp.dbModel);
            this.createDB(filePath);
        } catch (err) {
            // logDebug.debug(`Creating db: ${filePath}`);
            this.createDB(filePath, temp.dbModel);
        }
    }

    createDB(filePath, dbModel = {}) {
        const adapter = new wanStorage(filePath, {
            defaultValue: dbModel,
            serialize: (data) => JSON.stringify(data, null, 2),
            deserialize: (data) => JSON.parse(data)
        })
        this.db = low(adapter);
        this.tempdb = this.db.cloneDeep().value();
    }

    updateOriginDb(filePath, dbModel) {
        let originDb = JSON.parse(fs.readFileSync(filePath));

        for (let key in dbModel) {
            if (!originDb[key]) {
                originDb[key] = dbModel[key];
            }
        }
        for (let key in dbModel["collections"]["crossTransStatus"]) {
            if (!originDb["collections"]["crossTransStatus"][key]) {
                originDb["collections"]["crossTransStatus"][key] = dbModel["collections"]["crossTransStatus"][key];
            }
        }
        for (let key in dbModel["transModel"]) {
            if (!originDb["transModel"][key]) {
                originDb["transModel"][key] = dbModel["transModel"][key];
            }
        }
        fs.writeFileSync(filePath, JSON.stringify(originDb, null, 2), "utf8");
    }

    size() {
        return fs.statSync(this.filePath).size
    }

    getCollections() {
        return this.db.get('collections').cloneDeep().value();
    }

    getCollection(collName) {
        return this.db.get(`collections.${collName}`).cloneDeep().value();
    }

    insertItem(collName, data) {
        this.db.get(`collections.${collName}`).push(data).write();
    }
    updateItem(collName, keyObj, data) {
        this.db.get(`collections.${collName}`).find(keyObj).assign(data).write();
    }

    getItem(collName, keyObj) {
        return this.db.get(`collections.${collName}`).find(keyObj).value();
    }

    getItemAll(collName, keyObj) {
        return this.db.get(`collections.${collName}`).filter(keyObj).value();
    }
    
    close() {
        this.db.write();
    }
}

module.exports = wandb;