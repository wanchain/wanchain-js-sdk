/**
 *
 */

"use strict";

const LokiDb = require('./lokiDbCollection');
const WanDb  = require('../wandb');
const BTCWalletDB  = require('../btcwalletdb');

/**
 * @param: {Object} - config
 *     {
 *         btcWallet    - Source path of BTC wallet to migrate.
 *         databasePath - Destination path of BTC wallet to migrate.
 *         network      - testnet or main.
 *     }
 */
module.exports.migrateBTCWallet = async(config) => {
    let srcWalletDB = new LokiDb(config.btcWallet);
    await srcWalletDB.loadDatabase();

    let dstWalletDB = new BTCWalletDB(config.databasePath, config.network);

    // load src records
    let srcAddrs = srcWalletDB.getCollection('btcAddress').find();

    // load dst records
    let dstAddrs = dstWalletDB.getAddresses();

    let i;
    let alreadyIn = {};
    for (i=0; i<dstAddrs.length; i++) {
        //console.log(JSON.stringify(dstAddrs[i], null, 4));
        alreadyIn[dstAddrs[i].address] = true;
    }

    let count = 0;
    for (i=0; i<srcAddrs.length; i++) {
        let addr = {
            "address" : srcAddrs[i].address,
            "encryptedKey" : srcAddrs[i].encryptedKey
        }
        if (addr.address in alreadyIn) {
            console.log("Address already exist: ", JSON.stringify(addr, null, 4));
        } else {
            count ++;
            dstWalletDB.insertAddress(addr);
        }
    }

    dstWalletDB.close();

    console.log("Total import %d addresses", count);
};

/**
 * @param: {Object} - config
 *     {
 *         crossDbname        - Source path of histroy TX to migrate.
 *         srcCrossCollection - Table name of source histroy tx. 
 *         databasePath       - Destination path of BTC wallet to migrate.
 *         dstCrossCollection - Table name of destination histroy tx. 
 *         network            - testnet or main.
 *     }
 */
module.exports.importBTCHistroyTx = async(config) => {
    let srcTxDB = new LokiDb(config.crossDbname);
    await srcTxDB.loadDatabase();

    let dstTxDB = new WanDb(config.databasePath,config.network);

    // load src records
    let srcTxs = srcTxDB.getCollection(config.srcCrossCollection).find();

    let dstTxs = dstTxDB.getItemAll(config.dstCrossCollection, {});
    if (dstTxs.length > 0) {
        console.log("Histroy tx already imported, skip");
        return;
    }

    let count = 0;
    for (let i=0; i<srcTxs.length; i++) {
        count ++;
        dstTxDB.insertItem(config.dstCrossCollection, srcTxs[i]);
    }
    dstTxDB.close();

    console.log("Total import %d transactions", count);
};


