const { assert } = require('chai');
const WalletCore = require('../src/core/walletCore');
const {config, SLEEPTIME} = require('./support/config');
const { transferWTokenInput } = require('./support/input');
const { checkHash, sleepAndUpdateReceipt, normalTokenBalance, ccUtil } = require('./support/utils');
const { getWanBalance, getMultiTokenBalanceByTokenScAddr, getErc20Info } = ccUtil;

const desc = `Transfer ${transferWTokenInput.amount}${transferWTokenInput.symbol} On WAN From ${transferWTokenInput.from} to ${transferWTokenInput.to}`;

describe(desc, () => {
    let walletCore, srcChain, dstChain, ret, receipt, calBalances;
    let beforeFromWANBalance, beforeFromWTokenBalance, beforeToWTokenBalance;
    let afterFromWANBalance, afterFromWTokenBalance, afterToWTokenBalance;

    before(async () => {
        walletCore = new WalletCore(config);
        await walletCore.init();
        srcChain = global.crossInvoker.getSrcChainNameByContractAddr('WAN', 'WAN');
        dstChain = global.crossInvoker.getSrcChainNameByContractAddr(transferWTokenInput.tokenAddr, 'ETH');
        transferWTokenInput.decimals = (await getErc20Info(transferWTokenInput.tokenAddr)).decimals;
    });
    
    it('The Address Balance is not 0', async () => {
        try {
            [beforeFromWANBalance, beforeFromWTokenBalance, beforeToWTokenBalance] = await Promise.all([
                getWanBalance(transferWTokenInput.from),
                getMultiTokenBalanceByTokenScAddr([transferWTokenInput.from], dstChain[1].buddy, srcChain[0]),
                getMultiTokenBalanceByTokenScAddr([transferWTokenInput.to], dstChain[1].buddy, srcChain[0]),
            ]);
            [beforeFromWTokenBalance, beforeToWTokenBalance] = [beforeFromWTokenBalance[transferWTokenInput.from], beforeToWTokenBalance[transferWTokenInput.to]];
        } catch(e) {
            console.log(`Get Account Balance Error: ${e}`);
        }
        assert.notStrictEqual(beforeFromWANBalance, '0');
        assert.notStrictEqual(beforeFromWTokenBalance, '0');

    })
    it('Send Transfer Transaction', async () => {
        ret = await global.crossInvoker.invokeNormal(srcChain, dstChain, transferWTokenInput);
        console.log(`The transcation hash is ${ret.result}`);
        assert.strictEqual(checkHash(ret.result), true);
        while (!receipt) {
            receipt = await sleepAndUpdateReceipt(SLEEPTIME, ['WAN', ret.result])
        }
        assert.strictEqual(receipt.status, '0x1');
    })
    it('Check Balance After Sending Transaction', async () => {
        calBalances = normalTokenBalance([beforeFromWANBalance, beforeFromWTokenBalance, beforeToWTokenBalance], receipt, transferWTokenInput);
        try {
            [afterFromWANBalance, afterFromWTokenBalance, afterToWTokenBalance] = await Promise.all([
                getWanBalance(transferWTokenInput.from),
                getMultiTokenBalanceByTokenScAddr([transferWTokenInput.from], dstChain[1].buddy, srcChain[0]),
                getMultiTokenBalanceByTokenScAddr([transferWTokenInput.to], dstChain[1].buddy, srcChain[0]),
            ]);
        } catch(e) {
            console.log(`Get After TX Account Balance Error: ${e}`);
        }
        assert.strictEqual(afterFromWANBalance.toString(), calBalances[0]);
        assert.strictEqual(afterFromWTokenBalance[transferWTokenInput.from].toString(), calBalances[1]);
        assert.strictEqual(afterToWTokenBalance[transferWTokenInput.to].toString(), calBalances[2]);
    })
});