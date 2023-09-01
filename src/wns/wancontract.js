/**
 * WAN contracts
 *
 * Copyright (c) 2019, all rights reserved.
 */
'use strict'

let utils = require('../util/util');
let ccUtil = require('../api/ccUtil');
let error = require('../api/error');

let wnsutil = require('./util');

let logger = utils.getLogger('wancontract.js');

const networkTimeout = utils.getConfigSetting("network:timeout", 300000);

class WANContract {
    constructor(abi, addr) {
        this.abi = abi;
        this.addr = addr;
    }

    async build(func, hdr, ...args) {
        if (typeof hdr != 'object') {
            logger.error("Build invalid header!");
            throw new error.InvalidParameter("Invalid header!");
        }

        let contract = await this._buildHeader(hdr);
        contract.data = ccUtil.getDataByFuncInterface(this.abi, this.addr,
            func,
            ...args);

        return contract;
    }

    async call(func, ...args) {
        // Call iWAN for web3 invoke
        logger.debug("Call contract function '%s' at '%s'", func, this.addr);
        let res = await ccUtil.getIWanRpc().call('callScFunc', networkTimeout, ['WAN', this.addr, func, args, this.abi]);
        return res;
    }

    async send(func, txinfo, ...args) {
        // Send a transaction on chain
        let ctx = await this.build(func, txinfo, ...args);
        let res;

        try {
            let signed = await WANContract.sign(ctx, txinfo);
            res = await wnsutil.sendTransaction(signed);
            this.addRecord(func, ctx, res);
        } catch (err) {
            logger.error("Caught error when sending contract, error=[%s]", err);
            await ccUtil.addNonceHoleToList(ctx.from, 'WAN', ctx.nonce);
            throw err;
        }

        return res;
    }

    addRecord(func, tx, txhash) {
        let record = {
            "txHash"      : txhash,
            "from"        : tx.from,
            "to"          : tx.to,
            "value"       : tx.value,
            "gasPrice"    : tx.gasPrice,
            "gasLimit"    : tx.gasLimit,
            "nonce"       : tx.nonce,
            "srcSCAddrKey": "WAN",
            "srcChainType": "WAN",
            "tokenSymbol" : "ETH"
        }

        let satellite = {
            "function" : func
        }

        ccUtil.insertNormalTx(record, 'Sent', 'WNS', satellite);

    }

    static async sign(data, acct) {
        if (!acct.hasOwnProperty('BIP44Path')) {
            logger.error("Sign contract missing required parameter: [BIP44Path]!");
            throw new error.InvalidParameter("Missing required parameter: [BIP44Path]!");
        }

        if (!acct.hasOwnProperty('walletID')) {
            logger.error("Sign contract missing required parameter: [walletID]!");
            throw new error.InvalidParameter("Missing required parameter: [walletID]!");
        }

        let wanChn = global.chainManager.getChain('WAN');
        if (!wanChn) {
            // Ops, it's awkward
            throw new Error("Something went wrong, we don't have WAN registered");
        }

        let opt = utils.constructWalletOpt(acct.walletID, acct.password);
        let signed = await wanChn.signTransaction(acct.walletID, data, acct.BIP44Path, opt);

        return '0x' + signed.toString('hex');
    }

    async _buildHeader(hdr) {
        //
        if (!hdr.hasOwnProperty('from')) {
            logger.error("Build header missing required parameter: 'from'!");
            throw new error.InvalidParameter("Missing required parameter: 'from'!");
        }

        if (!hdr.hasOwnProperty('value')) {
            logger.error("Build header missing required parameter: 'value'!");
            throw new error.InvalidParameter("Missing required parameter: 'value'!");
        }

        if (!hdr.hasOwnProperty('gasPrice')) {
            logger.error("Build header missing required parameter: 'gasPrice'!");
            throw new error.InvalidParameter("Missing required parameter: 'gasPrice'!");
        }

        if (!hdr.hasOwnProperty('gasLimit')) {
            logger.error("Build header missing required parameter: 'gasLimit'!");
            throw new error.InvalidParameter("Missing required parameter: 'gasLimit'!");
        }

        let contract = {
            'Txtype' : '0x01',
            'from' : hdr.from,
            'to' : this.addr,
            // WARNING: wan decimals is 18
            'value' : ccUtil.tokenToWeiHex(hdr.value, 18),
            'gasPrice' : ccUtil.getGWeiToWei(hdr.gasPrice),
            'gasLimit' : Number(hdr.gasLimit),
            'gas' : Number(hdr.gasLimit)
        };

        if (hdr.hasOwnProperty('nonce')) {
            contract.nonce = hdr.nonce;
        } else {
            // TODO: chain type is wan
            contract.nonce = await ccUtil.getAddrNonce(hdr.from, 'WAN');
            logger.info("Get nonce returned:", contract.nonce);
        }

        if (hdr.hasOwnProperty('chainId')) {
            contract.chainId = hdr.chainId;
        } else {
            if (utils.isOnMainNet()) {
                contract.chainId = '0x378';
            } else {
                contract.chainId = '0x3e7';
            }
        }

        return contract;
    }
}

module.exports = WANContract;
