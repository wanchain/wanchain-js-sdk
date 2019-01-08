/**
 * creatBTCAddress
 */

let config = require('./config.json');
let setup  = require('./setup');
let ccUtil = require("../../src/api/ccUtil");

/**
 * Transfer parameter
 */

async function testDB() {
    let records = await ccUtil.getBtcWanTxHistory();
    console.log(records);
    console.log("Got %d records", records.length);
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
