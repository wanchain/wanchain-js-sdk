'use strict'

const bitcoin = require('bitcoinjs-lib');
const utils = require('../../../util/util');

let TxDataCreator = require('../common/TxDataCreator');
let btcUtil       =  require('../../../api/btcUtil');
let ccUtil        =  require('../../../api/ccUtil');

let logger = utils.getLogger('RedeemTxWbtcDataCreator.js');

class RedeemTxWbtcDataCreator extends TxDataCreator{
    /**
     * @param: {Object} -
     *     input {
     *         hashX:   -- No '0x' prefix !!!
     *         keypair: -- alice
     *         feeHard:
     *     }
     */
    constructor(input,config) {
        super(input,config);
        this.record = null;
    }

    createCommonData(){
        logger.debug("Entering RedeemTxWbtcDataCreator::createCommonData");

        let input  = this.input;
        let config = this.config;

        if (input.hashX === undefined) {
            this.retResult.code = false;
            this.retResult.result = "Input missing 'hashX'.";
        } else if (input.feeHard === undefined) {
            this.retResult.code = false;
            this.retResult.result = "Input missing 'feeHard'."
        } else {
            let commData = {
                    "from" : "",
                    "to"   : "",
                    "value": 0
                };
            //let records = ccUtil.getBtcWanTxHistory(this.config.crossCollection,{hashX: this.input.hashX});
            // input.hashX shouldn't start with '0x'
            let records = ccUtil.getBtcWanTxHistory({hashX: this.input.hashX});
            if (records && records.length > 0) {
                this.record = records[0];

                // Storeman is sender
                let senderH160Addr   = this.record.StoremanBtcH160; // StoremanBtcH160 is filled by monitor
                //let receiverH160Addr = bitcoin.crypto.hash160(this.input.keypair.publicKey).toString('hex');

                commData.value = this.record.value;
                commData.from = senderH160Addr;
                //commData.to   = receiverH160Addr;

                this.retResult.code   = true;
                this.retResult.result = commData;
            } else {
                this.retResult.code   = false;
                this.retResult.result = "Record not found";
            }
        }
        logger.debug("RedeemTxWbtcDataCreator::createCommonData completed.");
        return this.retResult;
    }

    async createContractData(){
        logger.debug("Entering RedeemTxWbtcDataCreator::createContractData");
        try {
            let redeemLockTimeStamp = Number(this.record.btcRedeemLockTimeStamp) / 1000;
            let senderH160Addr   = this.record.StoremanBtcH160; // StoremanBtcH160 is filled by monitor

            let chain = global.chainManager.getChain('BTC');
            let opt = utils.constructWalletOpt(this.record.btcCrossAddr.walletID, this.input.password);
            let kp = await chain.getECPair(this.record.btcCrossAddr.walletID, this.record.btcCrossAddr.path, opt);

            let receiverH160Addr = bitcoin.crypto.hash160(kp.publicKey).toString('hex');

            let x      = this.record.x;
            let amount = this.record.value;
            let txid   = this.record.btcLockTxHash;
            let vout   = 0;

            let contract = btcUtil.hashtimelockcontract(this.input.hashX, redeemLockTimeStamp, receiverH160Addr, senderH160Addr);

            let redeemScript = contract['redeemScript'];
            logger.debug("Redeem script: ", redeemScript);

            // Build tx & sign it
            // I'm afraid that I may not split build and sign ops !

            let sdkConfig = utils.getConfigSetting("sdk:config", undefined);
            var txb = new bitcoin.TransactionBuilder(sdkConfig.bitcoinNetwork);
            //txb.setLockTime(redeemLockTimeStamp);
            txb.setVersion(1);
            txb.addInput(txid, 0);

            let targetAddr = btcUtil.getAddressbyKeypair(kp);
            txb.addOutput(targetAddr, (amount - this.input.feeHard));

            let tx = txb.buildIncomplete();
            let sigHash = tx.hashForSignature(0, redeemScript, bitcoin.Transaction.SIGHASH_ALL);

            let redeemScriptSig = bitcoin.payments.p2sh({
                redeem: {
                    input: bitcoin.script.compile([
                        bitcoin.script.signature.encode(kp.sign(sigHash), bitcoin.Transaction.SIGHASH_ALL),
                        kp.publicKey,
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
            logger.error("Caught error when building contract data", error);
            this.retResult.code      = false;
            this.retResult.result    = error
        }
        logger.debug("RedeemTxWbtcDataCreator::createContractData completed.");
        return this.retResult;
    }
}

module.exports = RedeemTxWbtcDataCreator;
