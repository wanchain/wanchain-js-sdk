const fs = require('fs');
const path = require('path');

const baseDir = path.join(path.dirname(__filename), '../../../contracts/wan-jackpot');

const walkContract = (dir, contracts) => {
  let files = fs.readdirSync(dir);
  contracts = contracts || {};
  files.forEach(function(file) {
    let p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      contracts = walkContract(p, contracts);
    }
    else {
      if (file.indexOf('.sol') > 0) {
        // tool.logger.info('read contract: ', p);
        contracts[path.basename(p)] = fs.readFileSync(p, 'utf-8');
      }
    }
  });
  return contracts;
}

let source = walkContract(baseDir);

module.exports = source;