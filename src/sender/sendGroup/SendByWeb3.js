'use strict';

const net = require('net');
const Web3 = require('web3');

class SendByWeb3 {
  constructor(web3url) {
    global.logger.info("Entering SendByWeb3::constructor");
    this.web3 = new Web3(new Web3.providers.IpcProvider(web3url, net));
  }
  sendTrans(singedData) {
    let self = this;
    return new Promise(function(resolve,reject){
      if(self.web3.currentProvider.isConnected()){
        self.web3.eth.sendRawTransaction(singedData, function(err,txHash){
            if (!err){
              global.logger.debug("SendByWeb3::sendTrans hash:",txHash);
              resolve(txHash);
            }else{
              global.logger.error("SendByWeb3::sendTrans error:",err);
              reject(err);
            }
        });
      }else{
        global.logger.error("SendByWeb3::sendTrans connection is broken");
        reject("SendByWeb3::sendTrans connection is broken");
      }
    })

  }
}
module.exports = SendByWeb3;