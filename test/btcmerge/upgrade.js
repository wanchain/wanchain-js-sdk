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

testUpgrade();
