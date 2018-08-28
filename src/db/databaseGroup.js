"use strict";

const wandb = require('./wandb');

const dbInstance = {

    databaseAry : {},

    initDb(path, dbModel) {
        this.databaseAry = new wandb(path, dbModel);
    },

    size() {
        return this.databaseAry.size();
    }
};
module.exports = dbInstance;