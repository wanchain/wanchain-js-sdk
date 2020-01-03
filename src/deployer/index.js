'use strict'

// common
let initNonce            = require('./utils/scTool').initNonce;

// online
let deployLib            = require('./online/1_deployLib');
let deployContract       = require('./online/3_deployContract');
let setDependency        = require('./online/5_setDependency');
let registerToken        = require('./online/7_registerToken');
let registerSmg          = require('./online/9_registerSmg');

// offline
let buildDeployContract  = require('./offline/2_buildDeployContract');
let buildSetDependency   = require('./offline/4_buildSetDependency');
let buildRegisterToken   = require('./offline/6_buildRegisterToken');
let buildRegisterSmg     = require('./offline/8_buildRegisterSmg');

module.exports = {
  deployLib,             // step 1
  initNonce,             // prepare for offline  
  buildDeployContract,   // step 2
  deployContract,        // step 3
  buildSetDependency,    // step 4
  setDependency,         // step 5
  buildRegisterToken,    // step 6
  registerToken,         // step 7
  buildRegisterSmg,      // step 8
  registerSmg            // step 9
};
