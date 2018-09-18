'use strict'

let     errorHandle   = require('../../transUtil').errorHandle;
let     retResult     = require('../../transUtil').retResult;
let     DataSign      = require('../common/DataSign');
class BtcDataSign  extends  DataSign{
  constructor(input,config) {
    super(input,config);
  }
  sign(tran){
    global.logger.debug("Entering BtcDataSign::sign");
    retResult.code      = true;
    retResult.result    = tran;
    return retResult;
  }
}
module.exports = BtcDataSign;