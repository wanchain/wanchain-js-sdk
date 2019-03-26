'use strict'

const bitcoin = require('bitcoinjs-lib');
const wanUtil = require('../../../util/util');

let TxDataCreator = require('../common/TxDataCreator');
let btcUtil       =  require('../../../api/btcUtil');
let ccUtil        =  require('../../../api/ccUtil');

let logger = wanUtil.getLogger('RevokeTxBtcDataCreator.js');

class RevokeTxBtcDataCreator extends TxDataCreator{
    /**
     * @param: {Object} -
     *     input {
     *         hashX:    -- DO NOT start with '0x'
     *         keypair:  -- alice
     *         feeHard:
     *     }
     */
    constructor(input,config) {
        super(input,config);
        this.record = null;
    }

    createCommonData(){
      logger.debug("Entering RevokeTxBtcDataCreator::createCommonData");

      let input  = this.input;
      let config = this.config;

      if (input.hashX === undefined) { 
          this.retResult.code = false;
          this.retResult.result = "Input missing 'hashX'.";
      } else if (input.keypair === undefined) {
          this.retResult.code = false;
          this.retResult.result = "Input missgin 'keypair'.";
      } else if (input.feeHard === undefined) {
          this.retResult.code = false;
          this.retResult.result = "Input missing 'feeHard'.";
      } else {
          let commData = {
                  "from" : "",
                  "to"   : "",
                  "value": 0
              };
          //let records = ccUtil.getBtcWanTxHistory(this.config.crossCollection,{HashX: this.input.hashX});
          // HashX is NOT started with '0x'
          let records = ccUtil.getBtcWanTxHistory({HashX: this.input.hashX});
          if (records && records.length > 0) {
              this.record = records[0];

              let receiverH160Addr = this.record.storeman;
              let senderH160Addr   = bitcoin.crypto.hash160(this.input.keypair.publicKey).toString('hex');
              let amount = this.record.txValue;
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
      logger.debug("RevokeTxBtcDataCreator::createCommonData completed.");
      return this.retResult;
    }

    createContractData(){
      logger.debug("Entering RevokeTxBtcDataCreator::createContractData");
      try {
          let redeemLockTimeStamp = Number(this.record.btcRedeemLockTimeStamp) / 1000;
          let receiverH160Addr = this.record.storeman;
          let senderH160Addr   = bitcoin.crypto.hash160(this.input.keypair.publicKey).toString('hex');

          let x      = this.record.x;
          let value  = this.record.value;
          let amount = this.record.txValue;
          let txid   = this.record.btcLockTxHash;
          let vout   = 0;

          let contract = btcUtil.hashtimelockcontract(this.input.hashX, redeemLockTimeStamp, receiverH160Addr, senderH160Addr);

          let redeemScript = contract['redeemScript'];
          logger.debug("Revoke script", redeemScript);

          // Build tx & sign it
          // I'm afraid that I may not split build and sign ops !

          let sdkConfig = wanUtil.getConfigSetting("sdk.config", undefined);
          var txb = new bitcoin.TransactionBuilder(sdkConfig.bitcoinNetwork);
          txb.setLockTime(redeemLockTimeStamp);
          txb.setVersion(1);
          txb.addInput(txid, vout, 0);

          let targetAddr = btcUtil.getAddressbyKeypair(this.input.keypair);
          txb.addOutput(targetAddr, (amount - this.input.feeHard));

          let tx = txb.buildIncomplete();
          let sigHash = tx.hashForSignature(0, redeemScript, bitcoin.Transaction.SIGHASH_ALL);

          let redeemScriptSig = bitcoin.payments.p2sh({
              redeem: {
                  input: bitcoin.script.compile([
                      bitcoin.script.signature.encode(this.input.keypair.sign(sigHash), bitcoin.Transaction.SIGHASH_ALL),
                      this.input.keypair.publicKey,
                      bitcoin.opcodes.OP_FALSE
                  ]),
                  output: redeemScript,
              },
          }).input;
          tx.setInputScript(0, redeemScriptSig);

          this.retResult.code      = true;
          this.retResult.result    = {
                  "signedTxRaw" : tx.toHex(),
                  "to": receiverH160Addr
              };
      } catch (error) {
          logger.error("Caught error when building contract data", error);
          this.retResult.code      = false;
          this.retResult.result    = error 
      }
      logger.debug("RevokeTxBtcDataCreator::createContractData is completed.");
      return this.retResult;
    }
}

module.exports = RevokeTxBtcDataCreator;
