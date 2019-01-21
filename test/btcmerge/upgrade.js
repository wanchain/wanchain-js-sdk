/**
 */

const upgrade =require('../../src/db/upgrade/upgrade');

async function testUpgrade() {
    let config = {
        btcWallet : "/home/jujuchen/LocalDb/btcWallet.db",
        databasePath : "/home/jujuchen/LocalDb",
        network : "testnet"
    }
    upgrade.migrateBTCWallet(config);    
}

async function testImport() {
    let config = {
        crossDbname : "/home/jujuchen/LocalDb/crossTransDbBtc",
        srcCrossCollection : "btcCrossTransaction",
        databasePath : "/home/jujuchen/LocalDb",
        dstCrossCollection : "crossTransBtc", 
        network : "testnet"
    }
    upgrade.importBTCHistroyTx(config);    
}

//testUpgrade();
testImport();
