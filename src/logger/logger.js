const winston       = require("winston");
require('winston-daily-rotate-file');
const moment        = require('moment');
const util          = require('util');
const MESSAGE       = Symbol.for('message');
const SPLAT         = Symbol.for('splat');

/**
 * logger support 4 level  - enum{info, debug, warn, error}
 * @class
 */

class Logger {
  /**
   * @constructor
   * @param {string}  name    - The module name.
   * @param {string}  file    - The file's full name, use to write log information.
   * @param {string} errorFile - The file's full name, use to write error information.
   * @param {string} level    -  enum{info,debug,warn,error}
   */
  constructor(name, file, errorFile, level = 'info') {
    this.logger = winston.createLogger({
      level: level,
      format: winston.format(function(info, opts) {
        let prefix = util.format('%s %s %s %s', "walletCli", moment().format('YYYY-MM-DD HH:mm:ss,SSS').trim(), name, info.level.toUpperCase());
        if (info[SPLAT]) {
          info[MESSAGE] = util.format('%s %s', prefix, util.format(info.message, ...info[SPLAT]));
        } else {
          info[MESSAGE] = util.format('%s %s', prefix, util.format(info.message));
        }
        return info;
      })(),
      transports: [
        new(winston.transports.DailyRotateFile)({
          filename: file,
          level: level,
          datePattern: 'YYYY-MM-DD',
          zippedArchive: false,
          maxSize: '50m',
          maxFiles: '5d'
        })
      ]
    });
  }

  /**
   * Write debug information.
   */
  debug(...params) {
    this.logger.debug(...params);
  }

  /**
   * Write info level information.
   */
  info(...params) {
    this.logger.info(...params);
  }

  /**
   *  Write warning level information.
   */
  warn(...params) {
    this.logger.warning(...params);
  }

  /**
   * Write error level information.
   */
  error(...params) {
    this.logger.error(...params);
  }
}

module.exports = Logger;
