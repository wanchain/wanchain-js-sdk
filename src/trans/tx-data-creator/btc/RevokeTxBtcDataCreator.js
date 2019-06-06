'use strict'

const bitcoin = require('bitcoinjs-lib');
const utils = require('../../../util/util');

let TxDataCreator = require('../common/TxDataCreator');
let btcUtil       =  require('../../../api/btcUtil');
let ccUtil        =  require('../../../api/ccUtil');
let error         =  require('../../../api/error');

let logger = utils.getLogger('RevokeTxBtcDataCreator.js');

class RevokeTxBtcDataCreator extends TxDataCreator{
    /**
     * @param: {Object} -
     *     input {
     *         hashX: - DO NOT start with '0x'
     *         from:  - Object, {walletID: , path: }
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
          this.retResult.result = new error.InvalidParameter("Input missing 'hashX'.");
      //} else if (input.from === undefined || !input.from.hasOwnProperty('walletID') || !input.from.hasOwnProperty('path')) {
      //    // TODO: donot need from, we can get it from record
      //    this.retResult.code = false;
      //    this.retResult.result = new error.InvalidParameter("Input missing 'from'.");
      } else if (input.feeHard === undefined) {
          this.retResult.code = false;
          this.retResult.result = new error.InvalidParameter("Input missing 'feeHard'.");
      } else {
          let commData = {
                  "from" : "",
                  "to"   : "",
                  "value": 0
              };
          //let records = ccUtil.getBtcWanTxHistory(this.config.crossCollection,{hashX: this.input.hashX});
          // hashX is NOT started with '0x'
          let records = ccUtil.getBtcWanTxHistory({hashX: this.input.hashX});
          if (records && records.length > 0) {
              this.record = records[0];

              let amount = this.record.txValue;
              let txid   = this.record.btcLockTxHash;
              let vout   = 0;

              commData.value = amount;

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

    async createContractData(){
      logger.debug("Entering RevokeTxBtcDataCreator::createContractData");
      try {
          let f = this.input.from || this.record.from;
          let chain = global.chainManager.getChain('BTC');
          let opt = utils.constructWalletOpt(f.walletID, this.input.password);
          let addr = await chain.getAddress(f.walletID, f.path);
          let kp = await chain.getECPair(f.walletID, f.path, opt);

          let redeemLockTimeStamp = Number(this.record.btcRedeemLockTimeStamp) / 1000;
          let receiverH160Addr = this.record.storeman;
          let senderH160Addr   = bitcoin.crypto.hash160(kp.publicKey).toString('hex');

          let x      = this.record.x;
          let value  = this.record.value;
          let amount = this.record.txValue;
          let txid   = this.record.btcLockTxHash;
          let vout   = 0;

          let contract = btcUtil.hashtimelockcontract(this.input.hashX, redeemLockTimeStamp, receiverH160Addr, senderH160Addr);

          let redeemScript = contract['redeemScript'];
          logger.debug("Revoke script:", redeemScript.toString('hex'));

          // Build tx & sign it
          // I'm afraid that I may not split build and sign ops !

          let sdkConfig = utils.getConfigSetting("sdk:config", undefined);
          var txb = new bitcoin.TransactionBuilder(sdkConfig.bitcoinNetwork);
          txb.setLockTime(redeemLockTimeStamp);
          txb.setVersion(1);
          txb.addInput(txid, vout, 0);

          let targetAddr = addr.address;
          txb.addOutput(targetAddr, (amount - this.input.feeHard));

          let tx = txb.buildIncomplete();
          let sigHash = tx.hashForSignature(0, redeemScript, bitcoin.Transaction.SIGHASH_ALL);

          let redeemScriptSig = bitcoin.payments.p2sh({
              redeem: {
                  input: bitcoin.script.compile([
                      bitcoin.script.signature.encode(kp.sign(sigHash), bitcoin.Transaction.SIGHASH_ALL),
                      kp.publicKey,
                      bitcoin.opcodes.OP_FALSE
                  ]),
                  output: redeemScript,
              },
          }).input;
          tx.setInputScript(0, redeemScriptSig);

          this.retResult.code      = true;
          this.retResult.result    = {
                  "signedTxRaw" : tx.toHex(),
                  "from": senderH160Addr,
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
