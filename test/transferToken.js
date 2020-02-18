const { assert } = require('chai');
const WalletCore = require('../src/core/walletCore');
const {config, SLEEPTIME} = require('./support/config');
const { transferTokenInput } = require('./support/input');
const { checkHash, sleepAndUpdateReceipt, normalTokenBalance, ccUtil } = require('./support/utils');
const { getBalance, getMultiTokenBalanceByTokenScAddr, getTokenInfo } = ccUtil;

const desc = `Transfer ${transferTokenInput.amount}${transferTokenInput.symbol} On ETH From ${transferTokenInput.from} to ${transferTokenInput.to}`;

describe(desc, () => {
    let walletCore, srcChain, ret, receipt, calBalances;
    let beforeFromETHBalance, beforeFromTokenBalance, beforeToTokenBalance;
    let afterFromETHBalance, afterFromTokenBalance, afterToTokenBalance;

    before(async () => {
        walletCore = new WalletCore(config);
        await walletCore.init();
        srcChain = global.crossInvoker.getSrcChainNameByContractAddr(transferTokenInput.tokenAddr, 'ETH');
        transferTokenInput.decimals = (await getTokenInfo(transferTokenInput.tokenAddr, 'ETH')).decimals;
    });
    
    it('The Address Balance is not 0', async () => {
        try {
            [beforeFromETHBalance, beforeFromTokenBalance, beforeToTokenBalance] = await Promise.all([
                getBalance(transferTokenInput.from, 'ETH'),
                getMultiTokenBalanceByTokenScAddr([transferTokenInput.from], srcChain[0], srcChain[1].tokenType),
                getMultiTokenBalanceByTokenScAddr([transferTokenInput.to], srcChain[0], srcChain[1].tokenType),
            ]);
            [beforeFromTokenBalance, beforeToTokenBalance] = [beforeFromTokenBalance[transferTokenInput.from], beforeToTokenBalance[transferTokenInput.to]];
        } catch(e) {
            console.log(`Get Account Balance Error: ${e}`);
        }
        assert.notStrictEqual(beforeFromETHBalance, '0');
        assert.notStrictEqual(beforeFromTokenBalance, '0');
    })
    it('Send Transfer Transaction', async () => {
        ret = await global.crossInvoker.invokeNormalTrans(srcChain, transferTokenInput);
        console.log(`the transcation hash is ${ret.result}`);
        assert.strictEqual(checkHash(ret.result), true);
        while (!receipt) {
            receipt = await sleepAndUpdateReceipt(SLEEPTIME, ['ETH', ret.result])
        }
        assert.strictEqual(receipt.status, '0x1');
    })
    it('Check Balance After Sending Transaction', async () => {
        calBalances = normalTokenBalance([beforeFromETHBalance, beforeFromTokenBalance, beforeToTokenBalance], receipt, transferTokenInput);
        try {
            [afterFromETHBalance, afterFromTokenBalance, afterToTokenBalance] = await Promise.all([
                getBalance(transferTokenInput.from, 'ETH'),
                getMultiTokenBalanceByTokenScAddr([transferTokenInput.from], srcChain[0], srcChain[1].tokenType),
                getMultiTokenBalanceByTokenScAddr([transferTokenInput.to], srcChain[0], srcChain[1].tokenType),
            ]);
        } catch(e) {
            console.log(`Get After TX Account Balance Error: ${e}`);
        }
        assert.strictEqual(afterFromETHBalance.toString(), calBalances[0]);
        assert.strictEqual(afterFromTokenBalance[transferTokenInput.from].toString(), calBalances[1]);
        assert.strictEqual(afterToTokenBalance[transferTokenInput.to].toString(), calBalances[2]);
    })
});