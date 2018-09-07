/**
 * wanchain-js-sdk
 * This file is part of wanchain-js-sdk.
 * It's a common module to produce different logger instance
 * @file logger.js
 */

'use strict';

 /**
 * Module dependencies.
 * @private
 */
const util = require('util');
const path = require('path');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

/**
 * @constant
 * @default
 * @type {string}
 */
const defaultPath = path.join(__dirname, '../../', 'log');

/**
 * a formatter used for storing logs into files
 */
const comFormat = printf(info => {
    return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
});

/**
 * a formatter used for output to interface
 */
const debugFormat = printf(info => {
    return `${util.inspect(info.message)}`;
});


/** Class representing a Logger. */
class Logger {
    
    /**
     * Initialize a new `Logger` with the given `logPath` or a default `defaultPath`.
     * 
     * @param {string} logPath - The logPath value.
     */
    constructor(logPath = defaultPath) {
        this.logPath = logPath;
    }

    /**
     * Get a new instance of winston with the given `label` or a default value.
     * 
     * @return {object} The logger instance.
     * @public
     */
    getLogger(text = 'wanSdk') {
        let self = this;
        this.logger = createLogger({
            level: 'info',
            format: combine(
                label({
                    label: text
                }),
                timestamp(),
                comFormat
            ),
            transports: [
                new transports.File({
                    filename: `${self.logPath}/combined.log`
                }),
                new transports.File({
                    filename: `${self.logPath}/error.log`,
                    level: 'error'
                })
            ],
            exceptionHandlers: [
                new transports.File({
                    filename: `${self.logPath}/exceptions.log`
                })
            ]
        });

        this.updateFunc();
        return this.logger;
    }

    /**
     * Add or remove logger func according to environment.
     * 
     * @private.
     */
    updateFunc() {
        if (process.env.NODE_ENV !== 'production') {
            this.logger.add(new transports.Console({
                format: debugFormat,
                level: 'debug'
            }));
        }
    }
}

module.exports = Logger;