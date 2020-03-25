const Web3 = require('web3');
const Tx = require('ethereumjs-tx');
const cfg = require('../config.json');
const source = require('../source');
const ccUtil = require('../../../api/ccUtil');
const EthDataSign = require('../../../trans/data-sign/eth/EthDataSign');

const web3 = new Web3(/*new Web3.providers.HttpProvider("http://52.34.91.48:36892")*/);

let solc = null;

const compileContract = (name) => {
  if (solc == null) { // dynamic import to provoid error in Electron
    solc = require('solc');
  }

  let input = {};
  let fileName = name + ".sol";
  let key = fileName + ":" + name;
  input[fileName] = source[fileName];
  let output = solc.compile({sources: input}, 1);
  let result = output.contracts[key];
  if (result) {
    console.log("compileContract %s: %O", name, result);
    return result;
  } else {
    throw new Error("failed to compile contract " + name);
  }
}

const getDeployContractTxData = async (compiled, args = []) => {
  let contract = new web3.eth.Contract(JSON.parse(compiled.interface));
  let options = {data: '0x' + compiled.bytecode};
  if (args && (Object.prototype.toString.call(args)=='[object Array]') && (args.length > 0)) {
    options.arguments = args;
  }
  return await contract.deploy(options).encodeABI();
}

const serializeTx = async (data, nonce, contractAddr, value, walletId, path) => {
  // console.log("txdata=" + data);
  if (0 != data.indexOf('0x')){
    data = '0x' + data;
  }

  value = web3.utils.toWei(value, 'ether');
  value = new web3.utils.BN(value);
  value = '0x' + value.toString(16);

  let sender = await path2Address(walletId, path);
  // console.log("serializeTx address: %O", sender);

  let tx = {};
  tx.commonData = {
      nonce: nonce,
      gasPrice: cfg.gasPrice,
      gasLimit: cfg.gasLimit,
      to: contractAddr,
      value: value,
      from: sender
  };
  tx.contractData = data;
  // console.log("serializeTx: %O", tx);
  let signer = new EthDataSign({walletID: walletId, BIP44Path: path});
  let result = await signer.sign(tx);
  // console.log("serializeTx sign result: %O", result);
  return result.result;
}

const sendSerializedTx = async (tx) => {
  let txHash = await ccUtil.sendTrans(tx, 'ETH');
  console.log("sendSerializedTx hash: %s", txHash)  
  return txHash;
}

const waitReceipt = async (txHash, isDeploySc, times = 0) => {
  if (times >= 300) {
    console.log("%s receipt timeout", txHash);
    return null;
  }
  try {
    let response = await ccUtil.getTxReceipt('ETH', txHash);
    // console.log("waitReceipt %s times %d response: %O", txHash, times, response);
    if (isDeploySc) {
      if (response.status == '0x1') {
        return response.contractAddress;
      } else {
        tool.logger.error("%s times %d receipt failed", txHash, times);
        return null;
      }
    } else {
      return (response.status == '0x1');
    }
  } catch(e) {
    // console.log("waitReceipt %s times %d none: %O", txHash, times, e);
    return await waitReceipt(txHash, isDeploySc, times + 1);
  }
}

const path2Address = async (walletId, path) => {
  let chain = global.chainManager.getChain('ETH');
  let address = await chain.getAddress(walletId, path);
  return ccUtil.hexAdd0x(address.address);
}

const deployContract = async (name, compiled, walletId, path, ...args) => {
  console.log("deployContract args:", args);
  let txData = await getDeployContractTxData(compiled, args);
  let sender = await path2Address(walletId, path);
  let nonce = await getNonce(sender);
  let serialized = await serializeTx(txData, nonce, '', '0', walletId, path);
  console.log("deploying contract %s", name);
  let txHash = await sendSerializedTx(serialized);
  let address = await waitReceipt(txHash, true);
  if (address) {
    console.log("deployed contract %s address: %s", name, address);
    return address;
  } else {
    throw new Error("failed to deploy contract %s", name);
  }
}

const getNonce = async (address) => {
  let nonce = await ccUtil.getNonce(ccUtil.hexAdd0x(address), 'ETH');
  return nonce;
}

module.exports = {
  compileContract,
  deployContract
}