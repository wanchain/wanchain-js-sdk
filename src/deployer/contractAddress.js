const tool = require('./utils/tool');

const datePath = tool.getOutputPath('contractAddress');

let addressMap = new Map();

const setAddress = (name, address) => {
  addressMap.set(name, address);
  tool.write2file(datePath, JSON.stringify([...addressMap]));
}

const getAddress = (name) => {
  if (name) {
    return addressMap.get(name);
  } else {
    return addressMap;
  }
}

const loadAddress = () => {
  try {
    let data = tool.readFromFile(datePath);
    addressMap = new Map(JSON.parse(data));
  } catch (e) {
    addressMap = new Map();
  }
}

loadAddress();

module.exports = {
  setAddress,
  getAddress
}