"use strict";
require('../../core/globalVar');
console.log("in MessageTemplate.js");
console.log(global.getLogger);
const logDebug = global.getLogger('messageTemplate');
let index = 0;
class MessageTemplate {
  constructor(action, parameters, result, chainType, callback) {
    this.message = {
      header : {chain : chainType,action:action,index:index},
      action : action,
      parameters : parameters,
    }
    if(chainType !== ''){
      this.message.parameters.chainType = chainType;
    }
    this.result = result;
    this.callback = callback;
    ++index;
  }

  onMessage(message) {
    // logDebug.debug('getMessage: ',message);
    if (message.status === 'success') {
      // logDebug.debug(message[this.result]);
      this.callback && this.callback(null, message[this.result]);
    } else {
      logDebug.debug(`onMessage Error: ${message.error}`);
      this.callback && this.callback(message.error, null);
    }
  }
}

module.exports = MessageTemplate;