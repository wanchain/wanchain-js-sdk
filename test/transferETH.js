const { assert } = require('chai');
const WalletCore = require('../src/core/walletCore');
const {config, SLEEPTIME} = require('./support/config');
const { transferETHInput } = require('./support/input');
const { checkHash, sleepAndUpdateReceipt, normalETHBalance, ccUtil } = require('./support/utils');

const des = `Transfer ${transferETHInput.amount}ETH From ${transferETHInput.from} to ${transferETHInput.to}`;

describe(des, () => {
    let walletCore, srcChain, ret, receipt, calBalances;
    let beforeFromBalance, beforeToBalance;
    let afterFromBalance, afterToBalance;

    before(async () => {
        walletCore = new WalletCore(config);
        await walletCore.init();
        srcChain = global.crossInvoker.getSrcChainNameByContractAddr('ETH', 'ETH');
    });
    it('Address Balance is not 0', async () => {
        try {
            [beforeFromBalance, beforeToBalance] = await Promise.all([
                ccUtil.getEthBalance(transferETHInput.from),
                ccUtil.getEthBalance(transferETHInput.to)
            ]);
        } catch(e) {
            console.log(`Get Account Balance Error: ${e}`);
        }
        assert.notStrictEqual(beforeFromBalance, '0');
    })
    it('Send Transfer Transaction', async () => {
        ret = await global.crossInvoker.invokeNormalTrans(srcChain, transferETHInput);
        assert.strictEqual(checkHash(ret.result), true);
        console.log(`the transcation hash is ${ret.result}`);

        while (!receipt) {
            receipt = await sleepAndUpdateReceipt(SLEEPTIME, ['ETH', ret.result])
        }
        assert.strictEqual(receipt.status, '0x1');
    })
    it('Check Balance After Sending Transaction', async () => {
        calBalances = normalETHBalance([beforeFromBalance, beforeToBalance], receipt, transferETHInput);
        try {
            [afterFromBalance, afterToBalance] = await Promise.all([
                ccUtil.getEthBalance(transferETHInput.from),
                ccUtil.getEthBalance(transferETHInput.to)
            ]);
        } catch(e) {
            console.log(`Get After TX Account Balance Error: ${e}`);
        }
        assert.strictEqual(afterFromBalance.toString(), calBalances[0]);
        assert.strictEqual(afterToBalance.toString(), calBalances[1]);
    })

});