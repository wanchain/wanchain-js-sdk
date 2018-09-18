const fs = require('fs');
const ccUtil = require('../../src/api/ccUtil');

function listAccounts(keyStorePath) {
    let accounts = [];
    let files = fs.readdirSync(keyStorePath);

    files.forEach((item) => {
        let filename = keyStorePath + item;
        let stat = fs.lstatSync(filename);
        if (!stat.isDirectory()) {
            try {
                let keystoreStr = fs.readFileSync(filename, "utf8");
                let keystore = JSON.parse(keystoreStr);
                accounts.push(`0x${keystore.address}`);
            } catch (e) {
                global.logger.debug(e)
            }
        }
    })
    return accounts;
}

function checkHash(hash) {
    if (hash === null) {
        return false;
    }
    return (/^(0x)?[0-9a-fA-F]{64}$/i.test(hash));
}

async function getTokenByAddr(addr, contractAddr, chainType) {
    try {
        let tokenInfo = await ccUtil.getMultiTokenBalanceByTokenScAddr([addr], contractAddr, chainType);
        Promise.resolve(tokenInfo)
    } catch (e) {
        Promise.reject((e.hasOwnProperty("message")) ? e.message : e);
    }
}

async function getEthAccountInfo(localAccounts, address) {
    if (!localAccounts.includes(address)) {
        Promise.reject("getEthAccountsInfo error not found address");
    }

    try {
        let addrInfo = await ccUtil.getMultiEthBalances([address]);

        addrInfo.forEach((item) => {
            if (address === item.address) {
                // log.debug(sprintf("%46s %26s", "ETH address", "balance"));
                // log.debug(sprintf("%46s %26s", item.address, web3.fromWei(item.balance)));
                Promise.resolve(item);
            }
        });
        Promise.reject("getEthAccountsInfo error not found address");
    } catch (e) {
        Promise.reject((e.hasOwnProperty("message")) ? e.message : e);
    }
}

exports.checkHash = checkHash;
exports.listAccounts = listAccounts;
exports.getTokenByAddr = getTokenByAddr;
exports.getEthAccountInfo = getEthAccountInfo;