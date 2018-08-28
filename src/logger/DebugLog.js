var config = require('../config');
const logDebug = require('log4js');
let log4jsOptions = {
    appenders: {
        ruleConsole: {type: 'console'},
        ruleFile: {
            type: 'dateFile',
            filename: 'logs/server-',
            pattern: 'yyyy-MM-dd.log',
            maxLogSize: 10 * 1000 * 1000,
            numBackups: 3,
            alwaysIncludePattern: true
        }
    },
    categories: {
        default: {appenders: ['ruleConsole', 'ruleFile'], level: (config.loglevel || 'info')}
    }
};
if(config.logfile)
{
    log4jsOptions.appenders.ruleFile = {
        type: 'dateFile',
        filename: config.logfile,
        maxLogSize: 10 * 1000 * 1000,
        alwaysIncludePattern: true
    };
    log4jsOptions.categories.default.appenders.push('ruleFile');
}
logDebug.configure(log4jsOptions);
module.exports = logDebug.getLogger('wanchain');