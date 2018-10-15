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
                console.log(e)
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

function lockTokenBalance(beforeBalanceArr, receipts, input, direction) {
    let txfee
    let [original, token] = beforeBalanceArr.map(item => new BigNumber(item));
    let totalFee = receipts.reduce((total, item) => {
        let gasPrice = new BigNumber(input.lockInput.gasPrice);
        let gasUsed = new BigNumber(item.gasUsed);
        let gasFee = gasPrice.multipliedBy(gasUsed).multipliedBy(gWei);
        return total.plus(gasFee);
    }, new BigNumber(0));
    if(direction) {
        let amount = new BigNumber(web3.toWei(input.lockInput.amount));
        txfee = amount.multipliedBy(input.coin2WanRatio).multipliedBy(input.lockInput.txFeeRatio).div(10000).div(10000);
    }
    return [
        direction ? original.minus(totalFee).minus(txfee).toString() : original.minus(totalFee).toString(),
        token.minus(web3.toWei(input.lockInput.amount)).toString()
    ];
}

function redeemTokenBalance(beforeBalanceArr, receipts, input) {
    let [beforeWan, beforeWtoken] = beforeBalanceArr.map(item => new BigNumber(item));
    let totalFee = receipts.reduce((total, item) => {
        let gasPrice = new BigNumber(input.redeemInput.gasPrice);
        let gasUsed = new BigNumber(item.gasUsed);
        let gasFee = gasPrice.multipliedBy(gasUsed).multipliedBy(gWei);
        return total.plus(gasFee);
    }, new BigNumber(0));

    return [
        beforeWan.minus(totalFee).toString(),
        beforeWtoken.plus(web3.toWei(input.lockInput.amount)).toString()
    ];
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
    let tmp;
    await sleep(time);
    try {
        tmp = await ccUtil.getTxReceipt(...option)
    } catch(e) {
        console.log(e);
    }
    return Promise.resolve(tmp);
};

module.exports = {
    ccUtil,
    checkHash,
    listAccounts,
    getTokenByAddr,
    lockTokenBalance,
    getEthAccountInfo,
    redeemTokenBalance,
    sleepAndUpdateStatus,
    sleepAndUpdateReceipt,
};