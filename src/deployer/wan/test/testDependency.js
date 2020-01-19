const tool = require('../utils/tool');
const scTool = require('../utils/scTool');
const contractAddress = require('../contractAddress');

async function testToken(data, index, tm) {
  if (index >= data.length) {
    // tool.logger.info("testToken finished");
    return;
  }
  let success = true;
  let token = data[index];
  let tokenInfo = await tm.methods.getTokenInfo(token.tokenOrigAccount).call();
  if (tokenInfo[0] != tool.str2hex(token.name)) {
    console.error("token name mismatch: actual=%s, expected=%s", tokenInfo[0], token.name);
    success = false;
  }
  if (tokenInfo[1] != tool.str2hex(token.symbol)) {
    console.error("token symbol mismatch: actual=%s, expected=%s", tokenInfo[1], token.symbol);
    success = false;
  }
  if (tokenInfo[2] != token.decimals) {
    console.error("token %s decimals mismatch: actual=%s, expected=%s", token.symbol, tokenInfo[2], token.decimals);
    success = false;
  }
  // skip tokenWanAddr
  if (tokenInfo[4] != token.token2WanRatio) {
    console.error("token %s token2WanRatio mismatch: actual=%s, expected=%s", token.symbol, tokenInfo[4], token.token2WanRatio);
    success = false;
  }
  if (tokenInfo[5] != (token.minDeposit * (10 ** 18))) {
    console.error("token %s minDeposit mismatch: actual=%s, expected=%s", token.symbol, tokenInfo[5], token.minDeposit);
    success = false;
  }
  if (tokenInfo[6] != (token.withdrawDelayHours * 3600)) {
    console.error("token %s withdrawDelayTime mismatch: actual=%s, expected=%s", token.symbol, tokenInfo[6], (token.withdrawDelayHours * 3600));
    success = false;
  }
  if (tokenInfo[7] != 10000) {
    console.error("token %s DEFAULT_PRECISE mismatch: actual=%s, expected=%s", token.symbol, tokenInfo[7], 10000);
    success = false;
  }  
  if (success) {
    console.log("token %s ok", token.symbol);
  }
  return testToken(data, index + 1, tm);
}

async function testDependency(ContractOwnerAddr, smgDelegateAddr) {
  // get contract address
  let tmProxyAddress = contractAddress.getAddress('TokenManagerProxy');
  let tmDelegateAddress = contractAddress.getAddress('TokenManagerDelegate');
  let htlcProxyAddress = contractAddress.getAddress('HTLCProxy');
  let htlcDelegateAddress = contractAddress.getAddress('HTLCDelegate');
  let smgProxyAddress = contractAddress.getAddress('StoremanGroupProxy')
  let smgDelegateAddress = contractAddress.getAddress('StoremanGroupDelegate');

  // get web3 contract  
  let tmProxy = await scTool.getDeployedContract('TokenManagerProxy', tmProxyAddress);
  let tmDelegate = await scTool.getDeployedContract('TokenManagerDelegate', tmProxyAddress);
  let tm = await scTool.getDeployedContract('TokenManagerDelegate', tmProxyAddress);
  let htlcProxy = await scTool.getDeployedContract('HTLCProxy', htlcProxyAddress);
  let htlcDelegate = await scTool.getDeployedContract('HTLCDelegate', htlcProxyAddress);
  let htlc = await scTool.getDeployedContract('HTLCDelegate', htlcProxyAddress);
  let smgProxy = await scTool.getDeployedContract('StoremanGroupProxy', smgProxyAddress);
  let smgDelegate = await scTool.getDeployedContract('StoremanGroupDelegate', smgProxyAddress);
  let smg = await scTool.getDeployedContract('StoremanGroupDelegate', smgProxyAddress);

  let owner, implementation, dependency;

  // check TokenManager
  owner = await tmProxy.methods.owner().call();
  if (tool.cmpAddress(owner, ContractOwnerAddr)) {
    console.error("TokenManagerProxy owner ok");
  } else {
    console.log("TokenManagerProxy owner mismatch: actual=%s, expected=%s", owner, ContractOwnerAddr);    
  }
  owner = await tmDelegate.methods.owner().call();
  if (tool.cmpAddress(owner, ContractOwnerAddr)) {
    console.log("TokenManagerDelegate owner ok");
  } else {
    console.error("TokenManagerDelegate owner mismatch: actual=%s, expected=%s", owner, ContractOwnerAddr);
  }  
  implementation = await tmProxy.methods.implementation().call();
  if (tool.cmpAddress(implementation, tmDelegateAddress)) {
    console.log("TokenManagerDelegate address ok");
  } else {
    console.error("TokenManagerDelegate address mismatch: actual=%s, expected=%s", implementation, tmDelegateAddress);
  }
  dependency = await tm.methods.htlcAddr().call();
  if (tool.cmpAddress(dependency, htlcProxyAddress)) {
    console.log("TokenManager htlcAddr ok");
  } else {
    console.error("TokenManager htlcAddr mismatch: actual=%s, expected=%s", dependency, htlcProxy);
  }
  // check HTLC
  owner = await htlcProxy.methods.owner().call();
  if (tool.cmpAddress(owner, ContractOwnerAddr)) {
    console.log("HTLCProxy owner ok");
  } else {
    console.error("HTLCProxy owner mismatch: actual=%s, expected=%s", owner, ContractOwnerAddr);
  }
  owner = await htlcDelegate.methods.owner().call();
  if (tool.cmpAddress(owner, ContractOwnerAddr)) {
    console.log("HTLCDelegate owner ok");
  } else {
    console.error("HTLCDelegate owner mismatch: actual=%s, expected=%s", owner, ContractOwnerAddr);
  }  
  implementation = await htlcProxy.methods.implementation().call();
  if (tool.cmpAddress(implementation, htlcDelegateAddress)) {
    console.log("HTLCDelegate address ok");
  } else {
    console.error("HTLCDelegate address mismatch: actual=%s, expected=%s", implementation, htlcDelegateAddress);
  }
  dependency = await htlc.methods.getEconomics().call();
  if (tool.cmpAddress(dependency[0], tmProxyAddress)) {
    console.log("HTLC tokenManager ok");
  } else {
    console.error("HTLC tokenManager mismatch: actual=%s, expected=%s", dependency[0], tmProxyAddress);
  }
  if (tool.cmpAddress(dependency[1], smgProxyAddress)) {
    console.log("HTLC storemanGroupAdmin ok");
  } else {
    console.error("HTLC storemanGroupAdmin mismatch: actual=%s, expected=%s", dependency[1], smgProxyAddress);
  }
  if (dependency[2] == 0) {
    console.log("HTLC revokeFeeRatio ok");
  } else {
    console.error("HTLC revokeFeeRatio mismatch: actual=%s, expected=%s", dependency[2], 0);
  }
  // check StoremanGroupAdmin
  owner = await smgProxy.methods.owner().call();
  if (tool.cmpAddress(owner, ContractOwnerAddr)) {
    console.log("StoremanGroupProxy owner ok");
  } else {
    console.error("StoremanGroupProxy owner mismatch: actual=%s, expected=%s", owner, ContractOwnerAddr);
  }
  owner = await smgDelegate.methods.owner().call();
  if (tool.cmpAddress(owner, ContractOwnerAddr)) {
    console.log("StoremanGroupDelegate owner ok");
  } else {
    console.error("StoremanGroupDelegate owner mismatch: actual=%s, expected=%s", owner, ContractOwnerAddr);
  }
  implementation = await smgProxy.methods.implementation().call();
  if (tool.cmpAddress(implementation, smgDelegateAddress)) {
    console.log("StoremanGroupDelegate address ok");
  } else {
    console.error("StoremanGroupDelegate address mismatch: actual=%s, expected=%s", implementation, smgDelegateAddress);
  }
  dependency = await smg.methods.tokenManager().call();
  if (tool.cmpAddress(dependency, tmProxyAddress)) {
    console.log("StoremanGroupAdmin tokenManager ok");
  } else {
    console.error("StoremanGroupAdmin tokenManager mismatch: actual=%s, expected=%s", dependency, tmProxyAddress);
  }
  dependency = await smg.methods.htlc().call();
  if (tool.cmpAddress(dependency, htlcProxyAddress)) {
    console.log("StoremanGroupAdmin htlc ok");
  } else {
    console.error("StoremanGroupAdmin htlc mismatch: actual=%s, expected=%s", dependency, htlcProxyAddress);
  }
  // check tokens
  let tokenPath = tool.getInputPath('token');
  let tokenArray = require(tokenPath);  
  await testToken(tokenArray, 0, tm);
}

module.exports = testDependency;