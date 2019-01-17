/**
 * creatBTCAddress
 */

let config = require('./config.json');
let setup  = require('./setup');
let util   = require("./util");

/**
 * Transfer parameter
 */

async function testDB() {
    /**
     * BTC
     */
    let records = util.getBtcTxForRedeem();
    console.log("**********************************************************************");
    console.log("Got %d records for BTC redeem", records.length);
    console.log("**********************************************************************");
    for (let i=0; i<records.length; i++) {
        console.log(JSON.stringify(records[i], null, 4));
    }

    records = util.getBtcTxForRevoke();
    console.log("**********************************************************************");
    console.log("Got %d records for BTC revoke", records.length);
    console.log("**********************************************************************");
    for (let i=0; i<records.length; i++) {
        console.log(JSON.stringify(records[i], null, 4));
    }

    /**
     * WBTC
     */
    records = util.getWbtcTxForRedeem();
    console.log("**********************************************************************");
    console.log("Got %d records for WBTC redeem", records.length);
    console.log("**********************************************************************");
    for (let i=0; i<records.length; i++) {
        console.log(JSON.stringify(records[i], null, 4));
    }

    records = util.getWbtcTxForRevoke();
    console.log("**********************************************************************");
    console.log("Got %d records for WBTC revoke", records.length);
    console.log("**********************************************************************");
    for (let i=0; i<records.length; i++) {
        console.log(JSON.stringify(records[i], null, 4));
    }
    return Promise.resolve("OK");
}

async function main() {
    await setup.init();

    await testDB();    

    console.log("Bye");
}

main();
