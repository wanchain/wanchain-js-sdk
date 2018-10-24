const config = {
    port: 8545,
    useLocalNode: false,
    logPathPrex: '',
    loglevel: 'info',
    databasePathPrex: '',
    consoleColor: {
        'COLOR_FgRed': '\x1b[31m',
        'COLOR_FgYellow': '\x1b[33m',
        'COLOR_FgGreen': "\x1b[32m"
    }
};

const SLEEPTIME = 10000;

module.exports = {
    config,
    SLEEPTIME,
};
