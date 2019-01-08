'use strict'

//const bitcoin = require('bitcoinjs-lib');

let  DataSign = require('../common/DataSign');
let  btcUtil  = require('../../../api/btcUtil');

class BtcDataSign  extends  DataSign{
  constructor(input,config) {
    super(input,config);
  }

  sign(tran){
    global.logger.debug("Entering BtcDataSign::sign");

    if (tran.hasOwnProperty('signedTxRaw')) {
        this.retResult.code      = true;
        this.retResult.result    = tran.signedTxRaw;
    } else {
        let i;
        let txb    = tran.txb;
        let inputs = tran.inputs;
        let keyPairArray = tran.keypair;
        // get keys for signing
        //let addrList = [];
        //for (i = 0; i < inputs.length; i++) {
        //    addrList.push(inputs[i].address);
        //}

        //let keyPairArray = [];
        //for (i = 0; i < addrList.length; i++) {
        //    let kp = btcUtil.getECPairsbyAddr(this.input.password, addrList[i]);
        //    keyPairArray.push(kp);
        //}

        let addressKeyMap = {};
        for (i = 0; i < keyPairArray.length; i++) {
            let kp = keyPairArray[i];
            let address = btcUtil.getAddressbyKeypair(kp);
            addressKeyMap[address] = kp;
        }

        if (addressKeyMap.length === 0) {
            this.retResult.code      = false;
            this.retResult.result    = new Error("No bitcoin key pairs");
        } else {
            let rawTx;
            for (let i = 0; i < inputs.length; i++) {
                let inItem = inputs[i]
                let from = inItem.address
                let signer = addressKeyMap[from]
                txb.sign(i, signer)
            }
            rawTx = txb.build().toHex()

            global.logger.debug('rawTx: ', rawTx)

            this.retResult.code      = true;
            this.retResult.result    = rawTx;

        }
    }
    return this.retResult;
  }
}
module.exports = BtcDataSign;
