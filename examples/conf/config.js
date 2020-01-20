const config = {
    port: 8545, //wanchain api port
    useLocalNode: false, // if you like to use your local node, otherwise please set to false
    logPathPrex: '', // your logs directory prefix, if you like your logs file under current directory just leave it blank.
    loglevel: 'info', // log level, we have four levels info,debug,warn and error.
    databasePathPrex: '', // your lowdb dirctory prefix.
    network: "testnet", // or "main"
};

const SLEEPTIME = 10000; //sleep time checking for storeman event when redeem

module.exports = {
    config,
    SLEEPTIME,
};
