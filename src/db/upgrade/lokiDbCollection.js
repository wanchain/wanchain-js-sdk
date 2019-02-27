"use strict";

const loki = require('lokijs');
const fs=require('fs');
const path=require('path');

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

class LokiDb {
    constructor(file){
        mkdirsSync(path.dirname(file));
        this.db = new loki(file,
            {
                env: 'NODEJS',
                autosave: true,
                autosaveInterval: 1000
            });
    }
    loadDatabase(){
        let self = this;
         return new Promise(resolve => {
            self.db.loadDatabase({}, () => {
                resolve()
            })
        })       
    }
    getCollection(name) {
        let collection = this.db.getCollection(name) || this.db.addCollection(name);
        return collection;
    }
    close(){
        this.db.close();
    }
}
module.exports = LokiDb;
