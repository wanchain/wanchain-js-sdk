'use strict'

//const bitcoin = require('bitcoinjs-lib');

let  DataSign = require('../common/DataSign');
let  btcUtil  = require('../../../api/btcUtil');
let  utils    = require('../../../util/util');

let logger = utils.getLogger('BtcDataSign.js');

class BtcDataSign  extends  DataSign{
    constructor(input,config) {
        super(input,config);
    }
  
    sign(tran){
        logger.debug("Entering BtcDataSign::sign");
  
        if (tran.hasOwnProperty('signedTxRaw')) {
            logger.info("BTC transaction already signed")
            this.retResult.code      = true;
            this.retResult.result    = tran.signedTxRaw;
        } else {
            let i;
            let txb    = tran.txb;
            let inputs = tran.inputs;
            let keyPairArray = tran.keypair;
  
            let addressKeyMap = {};
            for (i = 0; i < keyPairArray.length; i++) {
                let kp = keyPairArray[i];
                let address = btcUtil.getAddressbyKeypair(kp);
                addressKeyMap[address] = kp;
            }
  
            if (addressKeyMap.length === 0) {
                logger.error("No bitcion key pairs found!!!");
                this.retResult.code   = false;
                this.retResult.result = new Error("No bitcoin key pairs");
            } else {
                let rawTx;
                for (let i = 0; i < inputs.length; i++) {
                    let inItem = inputs[i]
                    let from = inItem.address
                    let signer = addressKeyMap[from];
                    txb.sign(i, signer)
                }
                rawTx = txb.build().toHex()
  
                logger.debug('Signed rawTx: ', rawTx)
  
                this.retResult.code   = true;
                this.retResult.result = rawTx;

                logger.info('Sign BTC transaction successfully');
            }
        }
        logger.debug("BtcDataSign::sign completed");
        return this.retResult;
    }
}
module.exports = BtcDataSign;
