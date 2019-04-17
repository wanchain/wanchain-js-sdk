'use strict'

let  Transaction = require('../common/Transaction');
let  utils = require('../../../util/util');

let logger = utils.getLogger('BtcTransaction.js');

class BtcTransaction extends Transaction {
    constructor(input,config) {
        super(input,config);
        this.commonData   = null;
        this.contractData = null;
        this.txb          = null;
        this.inputs       = null;
        this.keypair      = null;
    }
    setCommonData(commonData){
        logger.debug("Entering BtcTransaction::setCommonData");
        // To Do
        this.commonData = commonData;
        this.retResult.code = true;

        logger.debug("BtcTransaction::setCommonData completed");
        return this.retResult;
    }
    setContractData(contractData){
        logger.debug("Entering BtcTransaction::setContractData");

        this.contractData = contractData;
        this.txb          = contractData.txb;
        this.inputs       = contractData.inputs;
        this.keypair      = contractData.keypair;
  
        if (contractData.hasOwnProperty('fee')) {
            this.commonData["fee"]= contractData.fee;
        }
        if (contractData.hasOwnProperty('from')) {
            this.commonData["from"] = contractData.from;
        }
        if (contractData.hasOwnProperty('to')) {
            this.commonData["to"] = contractData.to;
        }
        if (contractData.hasOwnProperty('redeemLockTimeStamp')) {
            this.commonData["redeemLockTimeStamp"] = 
  	          contractData.redeemLockTimeStamp;
        }
        if (contractData.hasOwnProperty('hashX')) {
            this.commonData["hashX"] = 
  	          contractData.hashX;
        }
  
        // If has 'signedTxRaw', then the tx already signed!!!
        if (contractData.hasOwnProperty('signedTxRaw')) {
            this.signedTxRaw = contractData.signedTxRaw;
        }
  
        this.retResult.code = true;

        logger.debug("BtcTransaction::setContractData completed");
        return this.retResult;
    }
}

module.exports = BtcTransaction;
