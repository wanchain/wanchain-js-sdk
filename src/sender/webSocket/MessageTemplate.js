"use strict";

const logDebug = global.getLogger('messageTemplate');

let index = 0;

class MessageTemplate {
    constructor(action, parameters, result, chainType, callback) {
        this.message = {
            header: {
                chain: chainType,
                action: action,
                index: index
            },
            action: action,
            parameters: parameters,
        }
        this.message.parameters.chainType = chainType;
        this.result = result;
        this.callback = callback;
        ++index;
    }

    onMessage(message) {
        logDebug.debug(message);
        if (message.status === 'success') {
            logDebug.debug(message[this.result]);
            this.callback || this.callback(null, message[this.result]);
        } else {
            logDebug.debug(message);
            this.callback || this.callback(message.error, null);    
        }
    }
}

module.exports = MessageTemplate;