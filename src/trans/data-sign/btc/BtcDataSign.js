'use strict'

let     DataSign      = require('../common/DataSign');
class BtcDataSign  extends  DataSign{
  constructor(input,config) {
    super(input,config);
  }
  sign(tran){
    global.logger.debug("Entering BtcDataSign::sign");
    this.retResult.code      = true;
    this.retResult.result    = tran;
    return this.retResult;
  }
}
module.exports = BtcDataSign;