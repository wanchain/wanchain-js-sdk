const path = require('path');
const tool = require('./tool');
const linker = require('solc/linker')
const Web3 = require('web3');
const cfg = require('../config.json');
const source = require('../source');
const ccUtil = require('../../../api/ccUtil');
const WanDataSign = require('../../../trans/data-sign/wan/WanDataSign');

const web3 = new Web3(new Web3.providers.HttpProvider("http://34.208.200.181:36891"));

let solc = null;

function getImport(filePath) {
  let fileName = path.basename(filePath);
  let content = source[fileName];
  if (content) {
    return {contents: source[fileName]};
  } else {
    return {error: 'File not found'}
  }
}

function getLibAddress(libs, refs) {
  /* IMPORTANT !!!
     libs is contract name, refs contains relative path, and has max 36 chars
     make sure contract has short name and relative path
  */
  let result = {};
  if (libs && libs.length > 0) {
    for (var ref in refs) {
      libs.forEach(lib => {
        if (ref.indexOf(lib) >= 0) {
          result[ref] = tool.getAddress('lib', lib);
        }
      })      
    }
  }
  // tool.logger.info("getLibAddress: %O", result);
  return result;
}

const compileContract = (name) => {
  if (solc == null) { // dynamic import to provoid error in Electron
    solc = require('solc');
  }

  let input = {};
  let fileName = name + ".sol";
  let key = fileName + ":" + name;
  input[fileName] = source[fileName];
  let output = solc.compile({sources: input}, 1, getImport);
  let result = output.contracts[key];
  if (result) {
    return result;
  } else {
    throw new Error("failed to compile contract " + name);
  }
}

const linkContract = (compiled, libs) => {
  let refs = linker.findLinkReferences(compiled.bytecode);
  // tool.logger.info("findLinkReferences: %O", refs);
  compiled.bytecode = linker.linkBytecode(compiled.bytecode, getLibAddress(libs, refs));
}

const getDeployContractTxData = async (compiled) => {
  let contract = new web3.eth.Contract(JSON.parse(compiled.interface), {data: '0x' + compiled.bytecode});
  return await contract.deploy().encodeABI();
}

const getDeployContractTxDataWithParams = async (compiled, params) => {
  let contract = new web3.eth.Contract(JSON.parse(compiled.interface), {data: '0x' + compiled.bytecode});
  return await contract.deploy({data: '0x' + compiled.bytecode, arguments: params}).encodeABI();
}

const serializeTx = async (data, nonce, contractAddr, value, walletId, path) => {
  // tool.logger.info("txdata=" + data);
  if (0 != data.indexOf('0x')){
    data = '0x' + data;
  }

  value = web3.utils.toWei(value, 'ether');
  value = new web3.utils.BN(value);
  value = '0x' + value.toString(16);

  let sender = await path2Address(walletId, path);
  // tool.logger.info("serializeTx address: %O", sender);

  let tx = {};
  tx.commonData = {
      Txtype: 0x01, // wanchain only
      nonce: nonce,
      gasPrice: cfg.gasPrice,
      gasLimit: cfg.gasLimit,
      to: contractAddr,
      value: value,
      from: sender
  };
  tx.contractData = data;
  // tool.logger.info("serializeTx: %O", tx);
  let signer = new WanDataSign({walletID: walletId, BIP44Path: path});
  let result = await signer.sign(tx);
  // tool.logger.info("serializeTx sign result: %O", result);
  return result.result;
}

const sendSerializedTx = async (tx) => {
  let txHash = await ccUtil.sendTrans(tx, 'WAN');
  tool.logger.info("sendSerializedTx hash: %s", txHash)  
  return txHash;
}

const waitReceipt = async (txHash, isDeploySc, times = 0) => {
  if (times >= 300) {
    tool.logger.info("%s receipt timeout", txHash);
    return null;
  }
  try {
    let response = await ccUtil.getTxReceipt('WAN', txHash);
    // tool.logger.info("waitReceipt %s times %d response: %O", txHash, times, response);
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
    // tool.logger.info("waitReceipt %s times %d none: %O", txHash, times, e);
    return await waitReceipt(txHash, isDeploySc, times + 1);
  }
}

const deployLib = async (name, compiled, walletId, path) => {
  let txData = await getDeployContractTxData(compiled);
  let sender = await path2Address(walletId, path);
  let nonce = await getNonce(sender);
  let serialized = await serializeTx(txData, nonce, '', '0', walletId, path);
  tool.logger.info("deploying contract %s", name);
  let txHash = await sendSerializedTx(serialized);
  let address = await waitReceipt(txHash, true);
  if (address) {
    tool.logger.info("deployed contract %s address: %s", name, address);
    return address;
  } else {
    throw new Error("failed to deploy contract " + name);
  }
}

const getDeployedContract = async (name, address) => {
  let compiled = compileContract(name);
  return new web3.eth.Contract(JSON.parse(compiled.interface), address);
}

const path2Address = async (walletId, path) => {
  let chain = global.chainManager.getChain('WAN');
  let address = await chain.getAddress(walletId, path);
  return ccUtil.hexAdd0x(address.address);
}

const initNonce = async (walletId, path) => {
  let address = await path2Address(walletId, path);
  let nonce = await getNonce(address);
  tool.updateNonce(address, nonce);
  return nonce;
}

const getNonce = async (address) => {
  let nonce = await ccUtil.getNonce(ccUtil.hexAdd0x(address), 'WAN');
  return nonce;
}

const getTxLog = async (txHash, contract, eventName, eventIndex) => {
  let abi = contract._jsonInterface;
  let item, eventAbi = null;
  for (let i = 0; i < abi.length; i++) {
    item = abi[i];
    if ((item.type == 'event') && (item.name == eventName)) {
      eventAbi = item.inputs;
    }
  }
  if (eventAbi == null) {
    tool.logger.error("event %s not found", eventName);
    return null;
  }
  let receipt;
  if (cfg.mode == 'debug') {
    receipt = await web3.eth.getTransactionReceipt(txHash);
  } else {
    receipt = await ccUtil.getTxReceipt('WAN', txHash);
  } 
  let log = await web3.eth.abi.decodeLog(eventAbi, receipt.logs[eventIndex].data, receipt.logs[eventIndex].topics);
  return log;
}

const wan2win = (wan) => {
  return web3.utils.toWei(wan.toString(), 'ether');
}

const getContractVar = async (contract, address, name) => {
  let compiled = compileContract(contract);
  let c = new web3.eth.Contract(JSON.parse(compiled.interface), address);
  return c.methods[name]().call();
}

//----

async function deploy(data, index, type, isDeploySC) {
  let sc = data[index];
  let scName = sc.name;
  let scData = sc.data;
  let txHash = await sendSerializedTx(scData);
  let address = await waitReceipt(txHash, isDeploySC);
  if (address && isDeploySC) {
    tool.setAddress(type, scName, address);
    tool.logger.info("deployed contract %s address: %s", scName, address);
    return true;
  } else if (address) {
    tool.logger.info("send tx success");
    return true;
  }else {
    tool.logger.error("failed to deploy contract %s", scName);
    return false;
  }
}

async function sendDeploy(type, isDeploySC) {
  let dataPath = tool.getInputPath(type);
  let data = JSON.parse(tool.readFromFile(dataPath));
  for (let i=0; i<data.length; i++) {
    let success = await deploy(data, i, type, isDeploySC);
    if (success == false) {
      tool.logger.error(type + " failed");
      return false
    }
  }

  return true;
}

module.exports = {
  compileContract,
  linkContract,
  getDeployContractTxData,
  getDeployContractTxDataWithParams,
  serializeTx,
  sendSerializedTx,
  waitReceipt,
  deployLib,
  getDeployedContract,
  path2Address,
  initNonce,
  getNonce,
  getTxLog,
  wan2win,
  getContractVar,
  //---
  deploy,
  sendDeploy,
}