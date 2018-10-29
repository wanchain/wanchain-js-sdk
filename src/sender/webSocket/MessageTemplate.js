"use strict";
let index = 0;

/**
 * @class
 * @classdesc  Common message Template.
 */
class MessageTemplate {
  /**
   * @constructor
   * @param {string} action     - Action supported by API server
   * @param {Array} parameters  - parameters for build message sent to server
   * @param {Object} result     - Result from API server,if error, sdk recieve reject promise.
   * @param {string} chainType  - which chain the action to be executed
   * @param {Function}callback  - Callback function for recieve message response from API server.
   */
  constructor(action, parameters, result, chainType, callback) {
    this.message = {
      header : {chain : chainType,action:action,index:index,from:'SDK'},
      action : action,
      parameters : parameters,
    };
    if(chainType !== ''){
      this.message.parameters.chainType = chainType;
    }
    this.result = result;
    this.callback = callback;
    ++index;
  }

  /**
   * Recieve message, if the message.status equal success, message valid; otherwise message invalid.
   * @param {Object} message  - Instance of {@link MessageTemplate MessageTemplate}
   */
  onMessage(message) {
    // logDebug.debug('getMessage: ',message);
    if (message.status === 'success') {
      // logDebug.debug(message[this.result]);
      let ret = {};
      if (this.result instanceof Array) {
        for (let i of this.result) {
          ret[i] = message[i]
        }
      } else{
        ret = message[this.result];
      }
      this.callback && this.callback(null, ret);
    } else {
      //logDebug.debug(`onMessage Error: ${message.error}`);
      this.callback && this.callback(message.error, null);
    }
  }
}

module.exports = MessageTemplate;
