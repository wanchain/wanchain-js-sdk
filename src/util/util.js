/**
 * Utility for internal usage
 *
 * Licensed under MIT.
 *
 * Copyright (c) 2019, Wanchain.
 */
'use strict';

// Configuration
const nconf  = require('nconf');
const path   = require('path');
/**
 * Crypto
 */
const crypto = require('crypto');
const unorm  = require('unorm');

// Logging
const util    = require('util');
const winston = require('winston');
require('winston-daily-rotate-file');
const { createLogger, format, transports } = winston;
const { combine, timestamp, label, printf } = format;
const SPLAT   = Symbol.for('splat');
const MESSAGE = Symbol.for('message');
const LABEL   = Symbol.for('label');
const TIMESTAMP= Symbol.for('timestamp');

const cipherAlgoAES256Cbc = 'aes-256-cbc';
const cipherDefaultIVMsg  = 'AwesomeWanchain!';

/**
 */
module.exports.promiseTimeout = function (ms, p){

    // Create a promise that rejects in <ms> milliseconds
    let timeout = new Promise((resolve, reject) => {
      let id = setTimeout(() => {
        clearTimeout(id);
        reject('Timed out in ' + ms + 'ms.')
      }, ms)
    });

    // Returns a race between our timeout and the passed in promise
    return Promise.race([
      p,
      timeout
    ]);
};

/**
 * Create hash
 *
 * @param {msg} - the message to hash
 * @param {algo} - the HASH algorithm to use
 * @returns {string} - digest of hashed message
 */
module.exports.createHash = function(msg, algo) {
   algo = algo || 'sha256';

   return crypto
      .createHash(algo)
      .update(msg)
      .digest();
};

module.exports.keyDerivationPBKDF2 = function(msg, dklen) {
    let msgBuf = unorm.nfkd(msg);
    let saltBuf = unorm.nfkd(cipherDefaultIVMsg);
    return crypto.pbkdf2Sync(msgBuf, saltBuf, 2048, dklen, 'sha512');
};

/**
 * Encrypt method
 *
 * @param {key} - The raw key for cipher algorithm, the length is different from algo:
 *                Algorithm   Key                iv
 *                aes128      16 byte (128 bits) 16 byte (128 bits)
 *                aes-128-cbc 16 byte (128 bits) 16 byte (128 bits)
 *                aes192      24 byte (192 bits) 16 byte (128 bits)
 *                aes256      32 byte (256 bits) 16 byte (128 bits) 
 * @param {iv} - Initialize vector, 16 bits length   
 * @param {data} - data to be encrypted   
 * @returns string - encrypted string
 */
module.exports.encrypt = function(key, iv, data) {
    let cipher = crypto.createCipheriv(cipherAlgoAES256Cbc, key, iv);
    let crypted = cipher.update(data, 'utf8', 'binary');
    crypted += cipher.final('binary');
    crypted = new Buffer(crypted, 'binary').toString('base64');
    return crypted;
},
 
/**
 * Decrypt method
 *
 * @param {key} - The raw key for decipher algorithm, the length is different from algo, refer encrypt for detail.
 * @param {iv} - Initialized vector     
 * @param {crypted} - the crypted data to be decrypted
 * @returns {string} - decrypted string
 */
module.exports.decrypt = function(key, iv, crypted) {
    crypted = new Buffer(crypted, 'base64').toString('binary');
    let decipher = crypto.createDecipheriv(cipherAlgoAES256Cbc, key, iv);
    let decoded = decipher.update(crypted, 'binary', 'utf8');
    decoded += decipher.final('utf8');
    return decoded;
},

/**
 * Get a logger for request module
 */
module.exports.getLogger = function(moduleName) {
    if (global.wanwallet && global.wanwallet.loggers && global.wanwallet.loggers.moduleName) {
        return global.wanwallet.loggers.moduleName;
    }

    let logger;

    let logconf = exports.getConfigSetting('logging', undefined);
    let logpath = exports.getConfigSetting('path.logpath', '/var/log');
    let option = {
        "transports" : []
    };
    if (logconf) {
        try {
            const config = typeof logconf === 'string' ? JSON.parse(logconf) : logconf;
            if (typeof config !== 'object') {
                throw new Error('Invalid logging configuration');
            }
            let level = config.level ? config.level : "info";

            if (config.transport === 'console') {
                option.transports.push(new transports.Console({
                   format: format.combine(
                       label( { label: moduleName }),
                       format.timestamp(),
                       format.colorize(),
                       _logFormat),
                   level: level,
                   stderrLevels: ['error']}));
            } else {
                option.transports.push(new transports.DailyRotateFile({
                   format: format.combine(
                       label({ label: moduleName }),
                       format.timestamp(),
                       _logFormat),
                    level: level,
                    filename: path.join(logpath, config.transport),
                    datePattern: 'YYYY-MM-DD',
                    zippedArchive: false,
                    maxSize: '50m',
                    maxFiles: '5d'
                }));
            }

            logger = winston.createLogger(option);
        } catch (err) {
            console.log(err);
            logger = _newDefaultLogger();
        }
    } else {
        logger = _newDefaultLogger();
    }

    if (global.wanwallet) {
        if (global.wanwallet.loggers) {
            global.wanwallet.loggers[moduleName] = logger;
        } else {
            global.wanwallet.loggers = {[moduleName] : logger };
        }
    } else {
        global.wanwallet = { "loggers": {[moduleName] : logger}};
    }

    return logger;
};

/**
 * Get configuration item specified by 'name'
 */ 
module.exports.getConfigSetting = function(name, defval) {
    let conf = _getConfig();
    let retval = null;

    try {
        retval = conf.get(name);
    } catch (err) {
        retval = defval;
    }

    if (retval == null || retval == undefined) {
        retval = defval
    }

    return retval;
};

/**
 * Set config item 'name' to 'value'
 */ 
module.exports.setConfigSetting = function(name, value) {
    _getConfig().set(name, value);
};

/**
 */
module.exports.isOnMainNet = function() {
    let network = exports.getConfigSetting('wanchain.network', 'mainnet');
    return network == 'mainnet';
};

/**
 * Get nconf
 */ 
function _getConfig() {
    if (global.wanwallet && global.wanwallet.config) {
        return global.wanwallet.config;
    }

    let conffile = path.normalize(path.join(__dirname, '../conf/config.json'));

    nconf.use('memory');
    nconf.argv()
       .env({parseValues: true, lowerCase: true})
       .file({file: conffile});

    if (global.wanwallet) {
        global.wanwallet.config = nconf;
    } else {
        global.wanwallet = { config : nconf };
    }

    return nconf;
};

const _logFormat = printf((info) => {
        let timestamp = Date.now(), label = 'main';
        if (info.timestamp) {
            timestamp = info.timestamp;
        }
        if (info.label) {
            label = info.label;
        }

        if (info[SPLAT]) {
            return util.format('%s %s [%s] %s', timestamp, info.level, label, util.format(info.message, ...info[SPLAT]));
        } else {
            return util.format('%s %s [%s] %s', timestamp, info.level, label, info.message);
        }
});

/**
 */
function _newDefaultLogger() {
    return createLogger({
            transports: [
                new transports.Console({
                       format: format.combine(
                           format.colorize(),
                           format.timestamp(),
                           _logFormat),
                       stderrLevels: ['error']})
            ]
        });
};

/* EOF */

