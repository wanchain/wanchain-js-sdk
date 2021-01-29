const utils   = require('../../../util/util');
let TxDataCreator = require('../common/TxDataCreator');
let logger = utils.getLogger('NormalTxXrpDataCreator.js');

class NormalTxXrpDataCreator extends TxDataCreator{
    /**
     * @param: {Object} -
     *     input {
     *         from:           - array, the from addresses
     *         to:             - target address
     *         value:          - amount to send
     *         feeRate:        -
     *         changeAddress:  - address to send if there's any change
     *         minConfirm:     - minimum confim blocks of UTXO to be spent
     *         maxConfirm:     - maximum confim blocks of UTXO to be spent
     *     }
     */
    constructor(input,config) {
        super(input,config);
    }
  
    /* New implementation */
    async createCommonData(){
        logger.debug("Entering NormalTxXrpDataCreator::createCommonData");
        let commData = {
                "from" : this.input.from,
                "to"   : this.input.to,
                "value": this.input.value
            };

        let chain = global.chainManager.getChain('XRP');

        let value = utils.toBigNumber(this.input.value).times('1e'+6).trunc();

        this.input.value = Number(value);
        logger.info(`Transfer amount [${this.input.value}]`);
        this.input.payment = {
          source: {
            address: this.input.from,
            maxAmount: {
              value: this.input.value.toString(),
              currency: 'drops',
            }
          },
          destination: {
            address: this.input.to,
            amount: {
              value: this.input.value.toString(),
              currency: 'drops',
            }
          }
        }
        if (this.input.tag) {
          this.input.payment.destination.tag = Number(this.input.tag);
        }
        this.retResult.code   = true;
        this.retResult.result = commData;

        logger.debug("NormalTxXrpDataCreator::createCommonData is completed");

        return  Promise.resolve(this.retResult);
    }
}

module.exports = NormalTxXrpDataCreator;
