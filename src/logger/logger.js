const util = require('util');
const path = require('path');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;


const comFormat = printf(info => {
    return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
});

const debugFormat = printf(info => {
    return `${util.inspect(info.message)}`;
});

const defaultPath = path.join(__dirname, '../../', 'log');

class Logger {
    constructor(logPath = defaultPath) {
        this.logPath = logPath;
    }

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

        this.init();
        return this.logger;
    }

    init() {
        if (process.env.NODE_ENV !== 'production') {
            this.logger.add(new transports.Console({
                format: debugFormat,
                level: 'debug'
            }));
        }
    }
}

module.exports = Logger;