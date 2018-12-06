const ccUtil = require('../../src/api/ccUtil');
const BigNumber = require('bignumber.js');
const gWei = 1000000000;
const NUMBER = 10000;

const Web3 = require('web3');
const web3 = new Web3;

function checkHash(hash) {
    if (hash === null) {
        return false;
    }
    return (/^(0x)?[0-9a-fA-F]{64}$/i.test(hash));
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
        txfee = amount.multipliedBy(input.coin2WanRatio).multipliedBy(input.lockInput.txFeeRatio).div(NUMBER).div(NUMBER);
    }
    return [
        direction ? original.minus(totalFee).minus(txfee).toString(10) : original.minus(totalFee).toString(10),
        token.minus(Math.pow(10, input.lockInput.decimals) * input.lockInput.amount).toString(10)
    ];
}

function redeemTokenBalance(beforeBalanceArr, receipt, input) {
    let [original, token] = beforeBalanceArr.map(item => new BigNumber(item));
    let gasPrice = new BigNumber(input.redeemInput.gasPrice);
    let gasUsed = new BigNumber(receipt.gasUsed);
    let txFee = gasPrice.multipliedBy(gasUsed).multipliedBy(gWei);
    !input.lockInput.decimals && (input.lockInput.decimals = 18);
    return [
        original.minus(txFee).toString(10),
        token.plus(Math.pow(10, input.lockInput.decimals) * input.lockInput.amount).toString(10)
    ];
}

function revokeTokenBalance(beforeBalanceArr, receipt, input, paras) {
    let [original, token] = beforeBalanceArr.map(item => new BigNumber(item));
    let gasPrice = new BigNumber(input.gasPrice);
    let gasUsed = new BigNumber(receipt.gasUsed);
    let txFee = gasPrice.multipliedBy(gasUsed).multipliedBy(gWei);
    let amount = new BigNumber(web3.toWei(paras.amount));
    let deciAmount = Math.pow(10, paras.decimals) * paras.amount;
    if(paras.chainType === 'WAN') {
        let refund = amount.multipliedBy(paras.coin2WanRatio).multipliedBy(paras.txFeeRatio).div(NUMBER).div(NUMBER);
        let penalty = refund.multipliedBy(paras.revokeFeeRatio).div(NUMBER)
        return [
            original.minus(txFee).plus(refund).minus(penalty).toString(10),
            token.plus(deciAmount).toString(10)
        ];
    } else {
        let penalty = (new BigNumber(deciAmount)).multipliedBy(paras.revokeFeeRatio).div(NUMBER);
        console.log(penalty.toString(10))
        return [
            original.minus(txFee).toString(10),
            token.plus(deciAmount).minus(penalty).toString(10)
        ]
    }
}

function normalETHBalance(beforeBalanceArr, receipt, input) {
    let [from, to] = beforeBalanceArr.map(item => new BigNumber(item));
    let gasPrice = new BigNumber(input.gasPrice);
    let gasUsed = new BigNumber(receipt.gasUsed);
    let txFee = gasPrice.multipliedBy(gasUsed).multipliedBy(gWei);
    return [
        from.minus(txFee).minus(web3.toWei(input.amount)).toString(10),
        to.plus(web3.toWei(input.amount)).toString(10)
    ];
}

function normalTokenBalance(beforeBalanceArr, receipt, input) {
    let [fromOrign, fromToken, toToken] = beforeBalanceArr.map(item => new BigNumber(item));
    let gasPrice = new BigNumber(input.gasPrice);
    let gasUsed = new BigNumber(receipt.gasUsed);
    let txFee = gasPrice.multipliedBy(gasUsed).multipliedBy(gWei);
    !input.decimals && (input.decimals = 18);
    return [
        fromOrign.minus(txFee).toString(10),
        fromToken.minus(Math.pow(10, input.decimals) * input.amount).toString(10),
        toToken.plus(Math.pow(10, input.decimals) * input.amount).toString(10)
    ];
}

function transferWanBalance(beforeBalanceArr, receipt, input) {
    let [from, to] = beforeBalanceArr.map(item => new BigNumber(item));
    let gasPrice = new BigNumber(input.gasPrice);
    let gasUsed = new BigNumber(receipt.gasUsed);
    let txFee = gasPrice.multipliedBy(gasUsed).multipliedBy(gWei);
    return [
        from.minus(txFee).minus(web3.toWei(input.amount)).toString(10),
        to.plus(web3.toWei(input.amount)).toString(10)
    ];
}

function lockETHBalance(beforeETHBalance, receipt, input) {
    let from = new BigNumber(beforeETHBalance);
    let gasPrice = new BigNumber(input.lockInput.gasPrice);
    let gasUsed = new BigNumber(receipt.gasUsed);
    let txFee = gasPrice.multipliedBy(gasUsed).multipliedBy(gWei);
    return from.minus(txFee).minus(web3.toWei(input.lockInput.amount)).toString(10);
}

function lockWETHBalance(beforeBalanceArr, receipt, input) {
    let [original, token] = beforeBalanceArr.map(item => new BigNumber(item));
    let amount = new BigNumber(web3.toWei(input.lockInput.amount));
    let gasPrice = new BigNumber(input.lockInput.gasPrice);
    let gasUsed = new BigNumber(receipt.gasUsed);
    let txFee = gasPrice.multipliedBy(gasUsed).multipliedBy(gWei);
    let penalty = amount.multipliedBy(input.coin2WanRatio).multipliedBy(input.lockInput.txFeeRatio).div(NUMBER).div(NUMBER);
    return [
        original.minus(txFee).minus(penalty).toString(10),
        token.minus(web3.toWei(input.lockInput.amount)).toString(10)
    ];
}

function redeemETHBalance(beforeETHBalance, receipt, input) {
    let original = new BigNumber(beforeETHBalance);
    let gasPrice = new BigNumber(input.redeemInput.gasPrice);
    let gasUsed = new BigNumber(receipt.gasUsed);
    let txFee = gasPrice.multipliedBy(gasUsed).multipliedBy(gWei);
    return original.plus(web3.toWei(input.lockInput.amount)).minus(txFee).toString(10);
}

function revokeETHBalance(beforeBalanceArr, receipt, input, paras) {
    let [original, token] = beforeBalanceArr.map(item => new BigNumber(item));
    let amount = new BigNumber(web3.toWei(paras.amount));
    let gasPrice = new BigNumber(input.revokeInput.gasPrice);
    let gasUsed = new BigNumber(receipt.gasUsed);
    let txFee = gasPrice.multipliedBy(gasUsed).multipliedBy(gWei);
    let val = amount.multipliedBy(paras.coin2WanRatio).multipliedBy(paras.txFeeRatio).div(NUMBER).div(NUMBER);
    if(paras.chainType === 'WAN') {
        return [
            original.minus(txFee).plus(val).toString(10),
            token.plus(amount).toString(10)
        ];
    } else {
        return [
            original.minus(txFee).plus(amount).toString(10)
        ];
    }
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
    } catch(e) {}
    return Promise.resolve(tmp);
};

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
    sleep,
    ccUtil,
    checkHash,
    getTokenByAddr,
    lockETHBalance,
    lockWETHBalance,
    redeemETHBalance,
    revokeETHBalance,
    normalETHBalance,
    lockTokenBalance,
    getEthAccountInfo,
    transferWanBalance,
    normalTokenBalance,
    redeemTokenBalance,
    revokeTokenBalance,
    sleepAndUpdateStatus,
    sleepAndUpdateReceipt,
};