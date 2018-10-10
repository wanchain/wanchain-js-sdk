'use strict';

const config = require('./support/config');
const { e20Input } = require('./support/input');
const BigNumber = require('bignumber.js');
const WalletCore = require('../src/core/walletCore');

const { assert } = require('chai');
const { checkHash } = require('./support/utils');
const { getEthBalance, getMultiTokenBalanceByTokenScAddr } = require('./support/utils').ccUtil;

const { CrossChainE20Lock } = require('../src/trans/CrossChain');


const  wrongPwdStr = 'Wrong password';

const stateDict = [
    'ApproveSending',
    'ApproveSendFail',
    'ApproveSendFailAfterRetries',
    'ApproveSent',
    'Approved',
    'LockSending',
    'LockSendFail',
    'LockSendFailAfterRetries',
    'LockSent',
    'Locked',
    'BuddyLocked',
    'RedeemSending',
    'RedeemSendFail',
    'RedeemSendFailAfterRetries',
    'RedeemSent',
    'Redeemed'
];

describe.only('ERC20-TO-WAN Crosschain', () => {
    let walletCore;
    let option;
    let record;

    before(async () => {
        // localAccounts.eth = listAccounts(cfgERC20.ethKeyStorePath);
        // localAccounts.wan = listAccounts(cfgERC20.wanKeyStorePath);
        walletCore = new WalletCore(config);
    });
    it('Normal Crosschain Transaction Case.', async () => {
        let beforeETHBalance, beforeTokenBalance, beforeWtokenBalance;
        await walletCore.init();

        try {
            [beforeETHBalance, beforeTokenBalance, beforeWtokenBalance] = await Promise.all([
                getEthBalance(e20Input.input.from),
                getMultiTokenBalanceByTokenScAddr([e20Input.input.from], e20Input.srcChain[0], e20Input.srcChain[1].tokenType),
                getMultiTokenBalanceByTokenScAddr([e20Input.input.from], e20Input.input.to, e20Input.dstChain[1].tokenType)
            ])
        } catch(e) {
            console.log(`Get Account Balance Error: ${e}`);
        }

        assert.notStrictEqual(beforeETHBalance, '0');
        assert.notStrictEqual(beforeTokenBalance[e20Input.input.from], '0');

        ret = await global.crossInvoker.invoke(e20Input.srcChain, e20Input.dstChain, 'LOCK', e20Input.input);
        if (ret.result !== wrongPwdStr) {
          needPwd = false;
        } else {
          vorpal.log(ret.result);
        }

        let isHash = checkHash(approveTxHash);
        assert.equal(isHash, true, approveTxHash);
        global.logger.debug(1111);
        process.exit(0);


        redeemWANCmdOptions.lockTxHash = lockTxHash;
        record = await testcore.getRecord(option);
        assert.equal(record.lockTxHash, lockTxHash);
        assert.equal(record.status, 'sentHashPending', "record.status is wrong");
        while (stateDict[record.status] < stateDict['waitingCross']) {
            record = await testcore.sleepAndUpdateStatus(sleepTime, option);
        }
        let receipt = await testcore.getTxReceipt('ETH', lockTxHash);
        assert.equal(receipt.status, "0x1");
        let gasUsed = new BigNumber(receipt.gasUsed);
        let gasPrice = new BigNumber(lockETHCmdOptions.gasPrice);
        let afterStep1ETHBalance = new BigNumber((await testcore.getEthAccountsInfo(getEthAccounts(lockETHCmdOptions.from))).balance);
        assert.equal(afterStep1ETHBalance.toString(), beforeETHBalance.sub(testcore.web3.toWei(lockETHCmdOptions.amount)).sub(gasPrice.mul(gasUsed).mul(gWei)).toString());
        while (stateDict[record.status] < stateDict['waitingX']) {
            record = await testcore.sleepAndUpdateStatus(sleepTime, option);
        }
        assert.equal(record.status, 'waitingX', "record.status is wrong");
        testcore.close();


        let redeemTxHash = await redeemWANCmd.runProc(redeemWANCmdOptions);
        redeemTxHash = redeemTxHash.replace(/[\r\n]/g, "");
        isHash = checkHash(redeemTxHash);
        assert.equal(isHash, true, redeemTxHash);


        await testcore.init();
        while (stateDict[record.status] < stateDict['redeemFinished']) {
            record = await testcore.sleepAndUpdateStatus(sleepTime, option);
        }
        result = await testcore.checkXConfirm(record, waitBlocks);
        assert.equal(record.redeemTxHash, redeemTxHash);
        assert.equal(record.status, 'redeemFinished', "record.status is wrong");
        assert.equal(result.status, "0x1");
        assert.equal(result.from, lockETHCmdOptions.cross.toLowerCase());
        let gasUsed2 = new BigNumber(result.gasUsed);
        let gasPrice2 = new BigNumber(redeemWANCmdOptions.gasPrice);
        let afterStep2ETHBalance = new BigNumber((await testcore.getEthAccountsInfo(getEthAccounts(lockETHCmdOptions.from))).balance);
        let afterStep2WanAccountInfo = await testcore.getWanAccountsInfo(lockETHCmdOptions.cross);
        let afterStep2WETHBalance = new BigNumber(afterStep2WanAccountInfo.wethBalance);
        let afterStep2WANBalance = new BigNumber(afterStep2WanAccountInfo.balance);
        assert.equal(afterStep2ETHBalance.toString(), afterStep1ETHBalance.toString());
        assert.equal(afterStep2WETHBalance.toString(), beforeWETHBalance.add(testcore.web3.toWei(lockETHCmdOptions.amount)).toString());
        assert.equal(afterStep2WANBalance.toString(), beforeWANBalance.sub(gasPrice2.mul(gasUsed2).mul(gWei)).toString());
        testcore.close();

    });
});
