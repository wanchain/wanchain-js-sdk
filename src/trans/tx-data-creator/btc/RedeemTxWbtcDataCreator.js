'use strict'

const bitcoin = require('bitcoinjs-lib');
const sdkConfig  = require('../../../conf/config');

let TxDataCreator = require('../common/TxDataCreator');
let btcUtil       =  require('../../../api/btcUtil');
let ccUtil        =  require('../../../api/ccUtil');

class RevokeTxWbtcDataCreator extends TxDataCreator{
    /**
     * @param: {Object} -
     *     input {
     *         hashX:
     *         keypair:     -- alice
     *         feeHard:
     *     }
     */
    constructor(input,config) {
        super(input,config);
        this.record = null;
    }

    createCommonData(){
      global.logger.debug("Entering RevokeTxWbtcDataCreator::createCommonData");

      let input  = this.input;
      let config = this.config;

      if (input.hashX === undefined) { 
          this.retResult.code = false;
          this.retResult.result = 'The hashX entered is invalid.';
      } else if (input.keypair === undefined) {
          this.retResult.code = false;
          this.retResult.result = 'The keypair entered is invalid.';
      } else if (input.feeHard === undefined) {
          this.retResult.code = false;
          this.retResult.result = 'The feeHard entered is invalid.';
      } else {
          let commData = {
                  "from" : "",
                  "to"   : "",
                  "value": 0
              };
          //let records = ccUtil.getBtcWanTxHistory(this.config.crossCollection,{HashX: this.input.hashX});
          let records = ccUtil.getBtcWanTxHistory({HashX: this.input.hashX});
          if (records && records.length > 0) {
              this.record = records[0];

              let senderH160Addr   = this.record.StoremanBtcH160; // StoremanBtcH160 is filled by monitor
              let receiverH160Addr = bitcoin.crypto.hash160(this.input.keypair.publicKey).toString('hex');

              let amount = this.record.value;
              let txid   = this.record.btcLockTxHash;
              let vout   = 0;

              commData.value = amount;
              commData.from = senderH160Addr;
              commData.to   = receiverH160Addr;

              this.retResult.code   = true;
              this.retResult.result = commData;
          } else {
              this.retResult.code   = false;
              this.retResult.result = "Record not found";
          }
      }
      return this.retResult;
    }

    createContractData(){
      global.logger.debug("Entering RevokeTxWbtcDataCreator::createContractData");
      try {
          let redeemLockTimeStamp = Number(this.record.btcRedeemLockTimeStamp) / 1000;
          let senderH160Addr   = this.record.StoremanBtcH160; // StoremanBtcH160 is filled by monitor
          let receiverH160Addr = bitcoin.crypto.hash160(this.input.keypair.publicKey).toString('hex');

          let x      = this.record.x;
          let amount = this.record.value;
          let txid   = this.record.btcLockTxHash;
          let vout   = 0;

          //let x      = this.record.x;
          //let value  = this.record.value;
          //let amount = this.record.txValue;
          //let txid   = this.record.btcLockTxHash;
          //let vout   = 0;

          let contract = btcUtil.hashtimelockcontract(x, redeemLockTimeStamp, receiverH160Addr, senderH160Addr);

          let redeemScript = contract['redeemScript'];

          // Build tx & sign it
          // I'm afraid that I may not split build and sign ops !

          var txb = new bitcoin.TransactionBuilder(sdkConfig.bitcoinNetwork);
          //txb.setLockTime(redeemLockTimeStamp);
          txb.setVersion(1);
          txb.addInput(txid, 0);

          let targetAddr = btcUtil.getAddressbyKeypair(this.input.keypair);
          txb.addOutput(targetAddr, (amount - this.input.feeHard));

          let tx = txb.buildIncomplete();
          let sigHash = tx.hashForSignature(0, redeemScript, bitcoin.Transaction.SIGHASH_ALL);

          let redeemScriptSig = bitcoin.payments.p2sh({
              redeem: {
                  input: bitcoin.script.compile([
                      bitcoin.script.signature.encode(this.input.keypair.sign(sigHash), bitcoin.Transaction.SIGHASH_ALL),
                      this.input.keypair.publicKey,
                      Buffer.from(x, 'hex'),
                      bitcoin.opcodes.OP_TRUE
                  ]),
                  output: redeemScript,
              },
              network: sdkConfig.bitcoinNetwork
          }).input;
          tx.setInputScript(0, redeemScriptSig);

          this.retResult.code      = true;
          this.retResult.result    = {
                  "signedTxRaw" : tx.toHex(),
                  "to": receiverH160Addr
              };
      } catch (error) {
          global.logger.error("Caught error when building contract data", error);
          this.retResult.code      = false;
          this.retResult.result    = error 
      }
      return this.retResult;
    }
}

module.exports = RevokeTxWbtcDataCreator;
