const tool = require('./utils/tool');

let addressMap = new Map();

const loadAddress = () => {
  try {
    let datePath = tool.getOutputPath('contractAddress');
    let data = tool.readFromFile(datePath);
    addressMap = new Map(JSON.parse(data));
  } catch {}
}

const setAddress = (name, address) => {
  if (addressMap.size == 0) {
    loadAddress()
  }
  addressMap.set(name, address);
  let datePath = tool.getOutputPath('contractAddress');
  tool.write2file(datePath, JSON.stringify([...addressMap]));
}

const getAddress = (name) => {
  if (addressMap.size == 0) {
    loadAddress()
  }  
  if (name) {
    return addressMap.get(name);
  } else {
    return addressMap;
  }
}

module.exports = {
  setAddress,
  getAddress
}