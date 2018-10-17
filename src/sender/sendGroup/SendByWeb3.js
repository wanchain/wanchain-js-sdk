'use strict';

const net = require('net');
const Web3 = require('web3');

class SendByWeb3 {
  constructor(web3url) {
    this.web3 = new Web3(new Web3.providers.IpcProvider(web3url, net));
  }
  sendTrans(singedData) {
    this.web3.eth.sendRawTransaction(singedData, function(err,hash){
      if (!err){
        return Promise.resolve(hash);
      }else{
        global.logger.error("SendByWeb3::sendTrans error:",err);
        return Promise.reject(err);
      }
    });
  }
}
module.exports = SendByWeb3;