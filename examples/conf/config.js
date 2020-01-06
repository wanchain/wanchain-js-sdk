const config = {
    port: 8545, //wanchain api port
    useLocalNode: false, // if you like to use your local node, otherwise please set to false
    logPathPrex: '', // your logs directory prefix, if you like your logs file under current directory just leave it blank.
    loglevel: 'info', // log level, we have four levels info,debug,warn and error.
    databasePathPrex: '', // your lowdb dirctory prefix.
    network: "testnet",
    iWAN: {
        "url" : "apitest.wanchain.org",
        "wallet" : {
            "apikey": "89c562e6ccf6afb4740bb45bccde2c5a0a1bf64c4fad0a94e7015d499a3cbcc4",
            "secret": "15d95f25f0e71eb485b4f497e4ad2804e47da02574cdc4fab5ce322d766b4a7d"
        }
    }
};

const SLEEPTIME = 10000; //sleep time checking for storeman event when redeem

module.exports = {
    config,
    SLEEPTIME,
};
