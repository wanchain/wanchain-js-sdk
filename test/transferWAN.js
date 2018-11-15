const { assert } = require('chai');
const WalletCore = require('../src/core/walletCore');
const {config, SLEEPTIME} = require('./support/config');
const { transferWANInput } = require('./support/input');
const { checkHash, sleepAndUpdateReceipt, transferWanBalance, ccUtil } = require('./support/utils');
const { getWanBalance } = ccUtil;

const desc = `Transfer ${transferWANInput.amount} ${transferWANInput.symbol} From ${transferWANInput.from} to ${transferWANInput.to}`;

describe(desc, () => {
    let walletCore, srcChain, ret, receipt, calBalances;
    let beforeFromWANBalance, beforeToWANBalance;
    let afterFromWANBalance, afterToWANBalance;

    before(async () => {
        walletCore = new WalletCore(config);
        await walletCore.init();
        srcChain = global.crossInvoker.getSrcChainNameByContractAddr('WAN', 'WAN');
    });
    
    it('The Address Balance is not 0', async () => {
        try {
            [beforeFromWANBalance, beforeToWANBalance] = await Promise.all([
                getWanBalance(transferWANInput.from),
                getWanBalance(transferWANInput.to)
            ]);
        } catch(e) {
            console.log(`Get Account Balance Error: ${e}`);
        }
        assert.notStrictEqual(beforeFromWANBalance, '0');
    })
    it('Send Transfer Transaction', async () => {
        ret = await global.crossInvoker.invokeNormalTrans(srcChain, transferWANInput);
        console.log(`the transcation hash is ${ret.result}`);
        assert.strictEqual(checkHash(ret.result), true);
        while (!receipt) {
            receipt = await sleepAndUpdateReceipt(SLEEPTIME, ['WAN', ret.result])
        }
        assert.strictEqual(receipt.status, '0x1');
    })
    it('Check Balance After Sending Transaction', async () => {
        calBalances = transferWanBalance([beforeFromWANBalance, beforeToWANBalance], receipt, transferWANInput);
        try {
            [afterFromWANBalance, afterToWANBalance] = await Promise.all([
                getWanBalance(transferWANInput.from),
                getWanBalance(transferWANInput.to)
            ]);
        } catch(e) {
            console.log(`Get After TX Account Balance Error: ${e}`);
        }
        console.log(afterFromWANBalance, afterToWANBalance, calBalances)
        assert.strictEqual(afterFromWANBalance.toString(), calBalances[0]);
        assert.strictEqual(afterToWANBalance.toString(), calBalances[1]);

    })
});