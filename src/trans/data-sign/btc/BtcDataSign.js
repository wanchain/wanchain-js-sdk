'use strict'

const bitcoin = require('bitcoinjs-lib');
const bitcoin6 = require('btcjs-lib6')
const ecc = require('tiny-secp256k1');
bitcoin6.initEccLib(ecc);

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
  
            let sdkConfig = utils.getConfigSetting('sdk:config', undefined); 
            if (addressKeyMap.length === 0) {
                logger.error("No bitcion key pairs found!!!");
                this.retResult.code   = false;
                this.retResult.result = new Error("No bitcoin key pairs");
            } else {
                let rawTx;
                if (txb instanceof bitcoin.TransactionBuilder) {
                    for (let i = 0; i < inputs.length; i++) {
                        let inItem = inputs[i]
                        let from = inItem.address
                        let signer = addressKeyMap[from];
                        txb.sign(i, signer)
                    }
                    rawTx = txb.build().toHex()
                } else {
                    for (let i = 0; i < inputs.length; i++) {
                        let inItem = inputs[i]
                        let from = inItem.address
                        let signer = addressKeyMap[from];
                        
                        const fromOutScript = bitcoin6.address.toOutputScript(from, sdkConfig.bitcoinNetwork)
                        let sigHash = txb.hashForSignature(i, fromOutScript, bitcoin6.Transaction.SIGHASH_ALL)
                        let signature = signer.sign(sigHash)
                        let sig = bitcoin6.script.signature.encode(signature, bitcoin6.Transaction.SIGHASH_ALL)
                        let scriptSig = bitcoin6.script.compile([sig, signer.publicKey])
                        txb.setInputScript(i, scriptSig)
                    }
                    rawTx = txb.toHex()
                }
  
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
