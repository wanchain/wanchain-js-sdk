/**
 * creatBTCAddress
 */

let config = require('./config.json');
let setup  = require('./setup');
let ccUtil = require("../../src/api/ccUtil");

/**
 * Transfer parameter
 */

async function testFetchStoreman() {
    let smgs = await ccUtil.getBtcSmgList();
    console.log(smgs);
    return Promise.resolve("OK");
}

async function main() {
    await setup.init();

    await testFetchStoreman();    

    console.log("Bye");
}

main();
