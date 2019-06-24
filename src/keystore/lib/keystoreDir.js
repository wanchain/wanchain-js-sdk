const fs = require('fs');
const path = require('path');
const Account = require('./account');
const utils   = require('../../util/util');

const logger = utils.getLogger('keystoreDir.js');

class Keystore {
  constructor(keystorePath) {
    this.Accounts = {};
    if (keystorePath) {
      this.keystorePath = keystorePath;
      this.initAccount();
    }
  }

  mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
      return true;
    } else {
      if (this.mkdirsSync(path.dirname(dirname))) {
        fs.mkdirSync(dirname);
        return true;
      }
    }
  }

  initAccount() {
    try {
      let files = fs.readdirSync(this.keystorePath);
      for (let i in files) {
        let item = files[i];
        let filename = path.join(this.keystorePath, item);
        let stat = fs.lstatSync(filename);
        if (!stat.isDirectory()) {
          let account = new Account(filename);
          if (account.keystore) {
            this.Accounts[account.getAddress()] = account;
          }
        }
      }
    } catch (e) {
      logger.error(this.keystorePath, "doesn't exist");
      this.mkdirsSync(this.keystorePath);
    }
  }

  getAccounts() {
    this.initAccount(); // try to get fresh info if new account added.
    return this.Accounts;
  }

  getAccount(address) {
    return this.Accounts[address.toLowerCase()];
  }
}

module.exports = Keystore;
