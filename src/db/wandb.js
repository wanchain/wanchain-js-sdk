"use strict";

const path = require('path');
const low = require('lowdb');
const fs = require('graceful-fs');
const dbModel = JSON.parse(fs.readFileSync(path.join(__dirname,'dbModel.json')));
const wanStorage = require('./wanStorage');
//const logDebug = global.getLogger('wanchaindb');

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

/**
 * @class
 */
class Wandb {
  /**
   * @constructor
   * @param {string} path - The file path, this file path is used to file db.
   * @param {string} net  - It used to describe the testnet db and main net db.
   */
  constructor(path, net, model, filename) {
    model = model || dbModel;
    filename = filename || `${path}/${model.name}_${net}.json`;

    this.db = null;
    this.tempdb = null;
    this.path = path;
    this.net = net;
    this.filePath = filename;
    this.init(model);
  }

  init(model = dbModel) {
    let temp = this;
    let filePath = temp.filePath;

    mkdirsSync(this.path);

    // if db file doesn't exist then create it
    try {
      //logDebug.debug(`Check that db exists and it's writeable: ${filePath}`);

      fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK);
      this.updateOriginDb(filePath);
      this.createDB(filePath);
    } catch (err) {
      //logDebug.debug(`Creating db: ${filePath}`);
      this.createDB(filePath, model);
    }
  }

  createDB(filePath, model = {}) {
    const adapter = new wanStorage(filePath, {
      defaultValue: model,
      serialize: (data) => JSON.stringify(data, null, 2),
      deserialize: (data) => JSON.parse(data)
    })
    this.db = low(adapter);
    this.tempdb = this.db.cloneDeep().value();
  }

  updateOriginDb(filePath, model = dbModel) {
    let originDb = JSON.parse(fs.readFileSync(filePath));

    for (let key in model) {
      if (!originDb[key]) {
        originDb[key] = model[key];
      }
    }
    // Add BTC collection
    if (!originDb["collections"]["crossTransBtc"] && model["collections"]["crossTransBtc"]) {
      originDb["collections"]["crossTransBtc"] = model["collections"]["crossTransBtc"];
    }

    for (let key in model["collections"]["crossTransStatus"]) {
      if (!originDb["collections"]["crossTransStatus"][key]) {
        originDb["collections"]["crossTransStatus"][key] = model["collections"]["crossTransStatus"][key];
      }
    }
    // TODO: should we add db model for BTC?
    for (let key in model["transModel"]) {
      if (!originDb["transModel"][key]) {
        originDb["transModel"][key] = model["transModel"][key];
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

  filterContains(collName, field, data) {
    return this.db.get(`collections.${collName}`).filter(o => data.includes(o[field])).value();
  }

  close() {
    this.db.write();
  }

  filterNotContains(collName, field, data) {
    return this.db.get(`collections.${collName}`).filter(o => !data.includes(o[field])).value();
  }

  filterContains(collName, field, data) {
    return this.db.get(`collections.${collName}`).filter(o => data.includes(o[field])).value();
  }

  queryComm(collName, func) {
    return this.db.get(`collections.${collName}`).filter(func).cloneDeep().value();
  }
}

module.exports = Wandb;
