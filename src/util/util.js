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
const secp256k1 = require('secp256k1');
// Logging
const util    = require('util');
const winston = require('winston');
require('winston-daily-rotate-file');
const { createLogger, format, transports } = winston;
const { label, printf, errors } = format;
const SPLAT   = Symbol.for('splat');
const MESSAGE = Symbol.for('message');
const LABEL   = Symbol.for('label');
const TIMESTAMP= Symbol.for('timestamp');

/**
 */
const BigNumber = require('bignumber.js');

const cipherAlgoAES256Cbc = 'aes-256-cbc';
const cipherDefaultIVMsg  = 'AwesomeWanchain!';

/**
 * Wallet
 */
const WID = require("../hdwallet/wallets/walletids");

const error = require("../api/error"); // Warning

/**
 * Promise with timeout
 */
module.exports.promiseTimeout = function (ms, p, desc){

    // Create a promise that rejects in <ms> milliseconds
    let id;
    let timeout = new Promise((resolve, reject) => {
        id = setTimeout(() => {
            clearTimeout(id);
            desc = desc || `Timed out in ${ms} ms!`;
            reject(new error.Timeout(desc));
        }, ms);
    });

    // Returns a race between our timeout and the passed in promise
    return Promise.race([
        p,
        timeout]);
};

/**
 * ----------------------------------------------------------------------------
 *  Encryption/Decryption utility
 * ----------------------------------------------------------------------------
 */

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

/**
 * Create hash with N times
 *
 * @param {msg} - the message to hash
 * @param {algo} - the HASH algorithm to use
 * @returns {string} - digest of hashed message
 */
module.exports.createHashN = function(msg, n, algo) {
    n = n || 1024;
    algo = algo || 'sha256';

    if (n < 1) {
        n = 1024;
    }

    while (n--) {
        let hash = crypto.createHash(algo);
        hash.update(msg);
        msg = hash.digest('hex');
    }

    return msg;
};

module.exports.randomString = function(length) {
    return crypto.randomBytes(Math.ceil(length/2))
            .toString('hex');
}

module.exports.hashSecret = function(secret, salt, iterations, dklen) {
    salt = salt || exports.randomString(128);
    iterations = iterations || 10000;
    dklen = dklen || 256;

    let hash = crypto.pbkdf2Sync(secret, salt, iterations, dklen, 'sha512');

    return {
        salt: salt,
        hash: hash.toString('hex'),
        iterations: iterations,
        dklen: dklen
    }
}

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
 */
module.exports.sec256k1PrivToPub = function(key) {
    // compressed format
    return secp256k1.publicKeyCreate(key, true);
},

/**
 * ----------------------------------------------------------------------------
 *  Logging utility
 * ----------------------------------------------------------------------------
 */

/**
 * Get a logger for request module
 */
module.exports.getLogger = function(moduleName) {
    if (global.wanwallet && global.wanwallet.loggers && global.wanwallet.loggers.moduleName) {
        return global.wanwallet.loggers.moduleName;
    }

    let logger;

    let logtransport = exports.getConfigSetting('logging:transport', 'console');
    let loglevel = exports.getConfigSetting('logging:level', 'info');
    let logpath = exports.getConfigSetting('path:logpath', '/var/log');
    let option = {
        "transports" : []
    };

    try {
        option.transports.push(_newLoggingTransport(logtransport, moduleName, loglevel, logpath, logtransport));
        logger = winston.createLogger(option);
    } catch (err) {
        console.log(err);
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

module.exports.resetLogger = function() {
    if (!global.wanwallet || !global.wanwallet.loggers) {
        return;
    }

    let logtransport = exports.getConfigSetting('logging:transport', 'console');
    let loglevel = exports.getConfigSetting('logging:level', 'info');
    let logpath = exports.getConfigSetting('path:logpath', '/var/log');
    for (let module in global.wanwallet.loggers) {
        let logger = global.wanwallet.loggers[module];
        let t = _newLoggingTransport(logtransport, module, loglevel, logpath, logtransport);

        logger.clear();
        logger.add(t);
    }

};

module.exports.updateLogger = function(moduleName, logconfig) {
    logconfig = logconfig || {};

    let logtransport = logconfig.transport || 'console'
    let loglevel = logconfig.level || 'info';
    let logpath = exports.getConfigSetting('path:logpath', '/var/log');
    let logger = global.wanwallet.loggers[moduleName];
    if (!logger) {
        return
    }
    let t = _newLoggingTransport(logtransport, moduleName, loglevel, logpath, logtransport);
    logger.clear();
    logger.add(t);
}

/**
 * ----------------------------------------------------------------------------
 *  Configuration
 * ----------------------------------------------------------------------------
 */

let _SDK__CONFIG = null;
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

    /**
     * Workaround, bitcoinjs uses !== to check network when building transaction,
     * but value returned from nconf is literaly same but the !== check is true!
     */
    if (name === 'sdk:config') {
        retval = _SDK__CONFIG;
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
    if (name === 'sdk:config') {
        _SDK__CONFIG=value;
    }
};

/**
 * ----------------------------------------------------------------------------
 *  HD Wallet utility
 * ----------------------------------------------------------------------------
 */

/**
 */
module.exports.isOnMainNet = function() {
    let network = exports.getConfigSetting('wanchain:network', 'mainnet');
    return network == 'mainnet';
};

/**
 * Split BIP44 path m/44'/chainID/...
 *
 * @param {path} string, bip44 path
 * @return {Array}, array of number, which each is number in level
 */
module.exports.splitBip44Path = function(path) {
    if (typeof path !== 'string') {
        throw new error.InvalidParameter("Invalid parameter");
    }

    let result = [];
    let splitPath = path.split('/');
    for (let i=1; i<splitPath.length; i++) {
        let elem = splitPath[i];
        let num = parseInt(elem);

        if (isNaN(num)) {
            throw new Error("Invalid path");
        }

        if (elem.length > 1 && elem[elem.length - 1] === "'") {
            num += 0x80000000;
        }
        result.push(num);
    }

    return result;
};

const _BIP44_PATH_LEN=5;

module.exports.getChainIDFromBIP44Path=function(path) {
    let p = exports.splitBip44Path(path);
    if (p.length != _BIP44_PATH_LEN) {
        throw new error.InvalidParameter(`Invalid path:${path}`)
    }

    let chainID = p[1];
    if (chainID >= 0x80000000) {
        chainID -= 0x80000000;
    }

    return chainID;
};

/**
 * Override properies' value  to '*******'
 * @function hiddenProperties
 *
 * @param inputObj
 * @param properties
 */
module.exports.hiddenProperties = function(inputObj, properties){
  if (typeof inputObj !== 'object') {
      return inputObj;
  }

  let retObj = {};
  Object.assign(retObj,inputObj);
  for(let propertyName of properties){
     if (retObj.hasOwnProperty(propertyName)) {
         retObj[propertyName] = '*******';
     }
  }
  return retObj;
};

/**
 * Deprecated!!!
 */
module.exports.toBigNumber = function(n) {
    n = n || 0;
    if (exports.isBigNumber(n)) {
        return n;
    }

    if ( typeof n === 'string' && (n.indexOf('0x') === 0 || n.indexOf('-0x') === 0)) {
        return new BigNumber(n.replace('0x',''), 16);
    }

    return new BigNumber(n.toString(10), 10);
};

module.exports.isBigNumber = function(n) {
    return n instanceof BigNumber ||
            (n && n.constructor && n.constructor.name === 'BigNumber');
}

/**
 * @param {check} boolean - force check or not
 */
module.exports.constructWalletOpt = function(wid, password, check) {
    if (typeof wid !== 'number') {
        throw new error.InvalidParameter("Missing Wallet ID!");
    }

    let forcechk = true;
    let checkfunc;
    if (wid === WID.WALLET_ID_NATIVE) {
        forcechk = false;
        checkfunc = this.revealMnemonic;
    } else if (wid === WID.WALLET_ID_KEYSTORE) {
        forcechk = false;
        checkfunc = this.revealMnemonic;
    }

    if (typeof password === 'string' && !password) {
        forcechk = true;
    }

    if (typeof check === 'boolean') {
        forcechk = check;
    }

    return new WID.WalletOpt(password, forcechk, checkfunc);
}

/**
 * Composite key for wallet refered by (wid, path)
 *
 * @param {wid} number - wallet ID
 * @param {path} string - BIP44 path
 * @return {string}
 */
module.exports.compositeWalletKey = function(wid, path) {
    if (typeof wid !== 'number' || typeof path !== 'string') {
        throw new error.InvalidParameter("Invalid wid and/or path!")
    }
    // validate path
    exports.splitBip44Path(path);

    return new Buffer(util.format('%d:%s', wid, path)).toString('base64');
}

/**
 * Decomposite key to (wid, path)
 *
 * @param {value} string - value returned by compositeWalletKey
 * @return {array} - array[0] is wallet ID, array[1] is bip44 path
 */
module.exports.decompositeWalletKey = function(value) {
    if (typeof value !== 'string') {
        throw new error.InvalidParameter("Invalid type of parameter!")
    }

    let v = new Buffer(value, 'base64').toString();
    let s = v.split(':')
    if (s.length != 2) {
        throw new error.InvalidParameter(`Invalid format: ${value}!`)
    }

    // validate path
    exports.splitBip44Path(s[1]);

    let r = {
        "wid" : parseInt(s[0], 10),
        "path": s[1]
    }
    return r;
}

/**
 * Add BIP44 path into object for sign
 */
module.exports.addBIP44Param = function(obj, wid, path) {
    if (typeof obj !== 'object') {
        throw new error.InvalidParameter("Missing obj!");
    }
    obj.waleltID = wid;
    obj.BIP44Path= path;

    return obj;
}

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
       .env({separator: '__', parseValues: true, lowerCase: true})
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

function _newLoggingTransport(transport, name, level, logdir, filename) {
    level = level || exports.getConfigSetting('logging:level', 'info');
    logdir = logdir || exports.getConfigSetting('path:logpath', '/var/log');
    filename = filename || transport;

    if (transport === 'console') {
        return (new transports.Console({
           format: format.combine(
               label( { label: name }),
               format.timestamp(),
               format.colorize(),
               _logFormat),
           level: level,
           stderrLevels: ['error']}));
    } else {
        return (new transports.DailyRotateFile({
           format: format.combine(
               label({ label: name }),
               format.timestamp(),
               _logFormat),
            level: level,
            filename: path.join(logdir, filename),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: false,
            maxSize: '50m',
            maxFiles: '5d'
        }));
    }

};

/* EOF */

