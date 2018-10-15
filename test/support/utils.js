const fs = require('fs');
const ccUtil = require('../../src/api/ccUtil');
const BigNumber = require('bignumber.js');
const gWei = 1000000000;

const Web3 = require('web3');
const web3 = new Web3;

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
                global.logger.error(e)
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

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateTokenBalance(beforeBalanceArr, receipts, input) {
    let [beforeETHBalance, beforeTokenBalance] = beforeBalanceArr;
    let totalFee = receipts.reduce((total, item) => {
        let gasPrice = new BigNumber(input.gasPrice);
        let gasUsed = new BigNumber(item.gasUsed);
        let gasFee = gasPrice.mul(gasUsed).mul(gWei);
        return total.add(gasFee);
    }, 0);

    beforeETHBalance.sub(totalFee).toString();
    beforeTokenBalance.sub(web3.toWei(input.amount)).toString();
    return [beforeETHBalance, beforeTokenBalance];
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
                Promise.resolve(item);
            }
        });
        Promise.reject("getEthAccountsInfo error not found address");
    } catch (e) {
        Promise.reject((e.hasOwnProperty("message")) ? e.message : e);
    }
}

async function sleepAndUpdateStatus(time, option) {
    await sleep(time);
    return Promise.resolve(global.wanDb.getItem(...option));
};

async function sleepAndUpdateReceipt(time, option) {
    await sleep(time);
    return Promise.resolve(ccUtil.getTxReceipt(...option));
};



exports.ccUtil = ccUtil;
exports.checkHash = checkHash;
exports.listAccounts = listAccounts;
exports.getTokenByAddr = getTokenByAddr;
exports.calculateBalance = calculateBalance;
exports.getEthAccountInfo = getEthAccountInfo;
exports.sleepAndUpdateStatus = sleepAndUpdateStatus;
exports.sleepAndUpdateReceipt = sleepAndUpdateReceipt;
exports.calculateTokenBalance = calculateTokenBalance;