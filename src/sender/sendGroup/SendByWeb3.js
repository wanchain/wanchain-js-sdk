'use strict';

const net = require('net');
const Web3 = require('web3');

const utils = require('../../util/util');

const logger = utils.getLogger('SendByWeb3.js');

/**
 * @class
 * @classdesc  Common web3 used communication with external modules.
 */
class SendByWeb3 {
  /**
   * @constructor
   * @param {string} web3url - The string path IPC used to connect local WAN node.
   */
  constructor(web3url) {
    logger.info("Entering SendByWeb3::constructor");
    this.web3 = new Web3(new Web3.providers.IpcProvider(web3url, net));
  }

  /**
   * send signed data to connect local WAN node by web3 interface.
   * @param {Object}singedData - see {@link DataSign#sign DataSign#sign}
   * @returns {Promise<any>}
   */
  sendTrans(singedData) {
    let self = this;
    return new Promise(function(resolve,reject){
      if(self.web3.currentProvider.isConnected()){
        self.web3.eth.sendRawTransaction(singedData, function(err,txHash){
            if (!err){
              logger.debug("SendByWeb3::sendTrans hash:",txHash);
              resolve(txHash);
            }else{
              logger.error("SendByWeb3::sendTrans error:",err);
              reject(err);
            }
        });
      }else{
        logger.error("SendByWeb3::sendTrans connection is broken");
        reject("SendByWeb3::sendTrans connection is broken");
      }
    })

  }
}
module.exports = SendByWeb3;
