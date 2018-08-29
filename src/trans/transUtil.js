'use strict'
let transUtil = {

  retResult : {
    // true: success false: error  default true
    code: true,
    // success: return the result
    // error  : return the error
    result: null
  },
  errorHandle: function errorHandle(){
    process.exit();
  }
};
exports.transUtil = transUtil;
exports.retResult = transUtil.retResult;
exports.errorHandle = transUtil.errorHandle;