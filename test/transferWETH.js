const { assert } = require('chai');
const WalletCore = require('../src/core/walletCore');
const {config, SLEEPTIME} = require('./support/config');
const { transferWETHInput } = require('./support/input');
const { checkHash, sleepAndUpdateReceipt, normalTokenBalance, ccUtil } = require('./support/utils');
const { getBalance, getMultiTokenBalanceByTokenScAddr } = ccUtil;

const desc = `Transfer ${transferWETHInput.amount} ${transferWETHInput.symbol} On WAN From ${transferWETHInput.from} to ${transferWETHInput.to}`;

describe(desc, () => {
    let walletCore, srcChain, dstChain, ret, receipt, calBalances;
    let beforeFromWANBalance, beforeFromWETHBalance, beforeToWETHBalance;
    let afterFromWANBalance, afterFromWETHBalance, afterToWETHBalance;

    before(async () => {
        walletCore = new WalletCore(config);
        await walletCore.init();
        srcChain = global.crossInvoker.getSrcChainNameByContractAddr('WAN', 'WAN');
        dstChain = global.crossInvoker.getSrcChainNameByContractAddr('ETH', 'ETH');
    });
    
    it('The Address Balance is not 0', async () => {
        try {
            [beforeFromWANBalance, beforeFromWETHBalance, beforeToWETHBalance] = await Promise.all([
                getBalance(transferWETHInput.from),
                getMultiTokenBalanceByTokenScAddr([transferWETHInput.from], dstChain[1].buddy, srcChain[0]),
                getMultiTokenBalanceByTokenScAddr([transferWETHInput.to], dstChain[1].buddy, srcChain[0]),
            ]);
            [beforeFromWETHBalance, beforeToWETHBalance] = [beforeFromWETHBalance[transferWETHInput.from], beforeToWETHBalance[transferWETHInput.to]];
        } catch(e) {
            console.log(`Get Account Balance Error: ${e}`);
        }
        assert.notStrictEqual(beforeFromWANBalance, '0');
        assert.notStrictEqual(beforeFromWETHBalance, '0');
    })
    it('Send Transfer Transaction', async () => {
        ret = await global.crossInvoker.invokeNormal(srcChain, dstChain, transferWETHInput);
        console.log(`The transcation hash is ${ret.result}`);
        assert.strictEqual(checkHash(ret.result), true);
        while (!receipt) {
            receipt = await sleepAndUpdateReceipt(SLEEPTIME, ['WAN', ret.result])
        }
        assert.strictEqual(receipt.status, '0x1');
    })
    it('Check Balance After Sending Transaction', async () => {
        calBalances = normalTokenBalance([beforeFromWANBalance, beforeFromWETHBalance, beforeToWETHBalance], receipt, transferWETHInput);
        try {
            [afterFromWANBalance, afterFromWETHBalance, afterToWETHBalance] = await Promise.all([
                getBalance(transferWETHInput.from),
                getMultiTokenBalanceByTokenScAddr([transferWETHInput.from], dstChain[1].buddy, srcChain[0]),
                getMultiTokenBalanceByTokenScAddr([transferWETHInput.to], dstChain[1].buddy, srcChain[0]),
            ]);
        } catch(e) {
            console.log(`Get After TX Account Balance Error: ${e}`);
        }
        assert.strictEqual(afterFromWANBalance.toString(), calBalances[0]);
        assert.strictEqual(afterFromWETHBalance[transferWETHInput.from].toString(), calBalances[1]);
        assert.strictEqual(afterToWETHBalance[transferWETHInput.to].toString(), calBalances[2]);
    })
});