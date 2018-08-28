'use strict'

const Web3 = require("web3");
const WebSocket = require('ws');
const pu = require('promisefy-util');
const BigNumber = require('bignumber.js');
const wanUtil = require("wanchain-util");
const keythereum = require("keythereum");
const { keystoreDir } = require('wanchain-keystore');
const logger = config.getLogger("crossChainUtil");
const config;

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));


keythereum.constants.quiet = true;

const Backend = {

    toGweiString(cwei){
        let exp = new BigNumber(10);
        let wei = new BigNumber(cwei);
        let gwei = wei.dividedBy(exp.pow(9));
        return gwei.toString(10);
    },

    async init(config, ethsender, wansender, cb) {
        this.EthKeyStoreDir = new keystoreDir(config.ethKeyStorePath),
        this.WanKeyStoreDir = new keystoreDir(config.wanKeyStorePath),
        this.ethSender = ethsender;
        this.wanSender = wansender;

        if (config.useLocalNode && !this.web3Sender) {
            this.web3Sender = this.createrWeb3Sender(config.rpcIpcPath);
        }
        
        this.ethAddrs = Object.keys(this.EthKeyStoreDir.getAccounts());
        this.wanAddrs = Object.keys(this.WanKeyStoreDir.getAccounts());
        global.lockedTime = await this.getEthLockTime(this.ethSender);
        this.c2wRatio = await this.getEthC2wRatio(this.wanSender);
        if (cb) cb();
    },

    getCrossdbCollection() {
        return this.getCollection(config.crossDbname,config.crossCollection);
    },
    async getSenderbyChain(chainType){
        let sender;
        if(chainType == 'web3'){
            sender = this.web3Sender;
            return sender;
        }
        else if(chainType == 'ETH'){
            sender = this.ethSender;
            if(sender.socket.connection.readyState != WebSocket.OPEN) {
                sender = await  this.createrSocketSender("ETH");
                this.ethSender = sender;
            }
            return sender;
        }
        else if(chainType == 'WAN'){
            sender = this.wanSender;
            if(sender.socket.connection.readyState != WebSocket.OPEN) {
                sender = await  this.createrSocketSender("WAN");
                this.wanSender = sender;
            }
            return sender;
        }
    },
    async createrSender(ChainType, useWeb3=false){
        if(config.useLocalNode && ChainType=="WAN" && useWeb3){
            return this.createrWeb3Sender(config.rpcIpcPath);
        }else{
            return await this.createrSocketSender(ChainType);
        }

    },

    async getEthAccountsInfo(sender) {
        let bs;
        try {
            this.ethAddrs  = Object.keys(this.EthKeyStoreDir.getAccounts());
            bs = await this.getMultiEthBalances(sender,this.ethAddrs);
        }
        catch(err){
            logger.error("getEthAccountsInfo", err);
            return [];
        }
        let infos = [];
        for(let i=0; i<this.ethAddrs.length; i++){
            let info = {};
            info.balance = bs[this.ethAddrs[i]];
            info.address = this.ethAddrs[i];
            infos.push(info);
        }

        logger.debug("Eth Accounts infor: ", infos);
        return infos;
    },
    async getWanAccountsInfo(sender) {
        this.wanAddrs  = Object.keys(this.WanKeyStoreDir.getAccounts());
        let bs = await this.getMultiWanBalances(sender,this.wanAddrs);
        let es = await this.getMultiTokenBalance(sender,this.wanAddrs);
        let infos = [];
        for(let i=0; i<this.wanAddrs.length; i++){
            let info = {};
            info.address = this.wanAddrs[i];
            info.balance = bs[this.wanAddrs[i]];
            info.wethBalance = es[this.wanAddrs[i]];
            infos.push(info);
        }

        logger.debug("Wan Accounts infor: ", infos);
        return infos;
    },

    getEthSmgList(sender) {
        let b = pu.promisefy(sender.sendMessage, ['syncStoremanGroups'], sender);
        return b;
    },
    getTxReceipt(sender,txhash){
        let bs = pu.promisefy(sender.sendMessage, ['getTransactionReceipt',txhash], sender);
        return bs;
    },
    getTxInfo(sender,txhash){
        let bs = pu.promisefy(sender.sendMessage, ['getTxInfo',txhash], sender);
        return bs;
    },
    createEthAddr(keyPassword){
        let params = { keyBytes: 32, ivBytes: 16 };
        let dk = keythereum.create(params);
        let options = {
            kdf: "scrypt",
            cipher: "aes-128-ctr",
            kdfparams: {
                n: 8192,
                dklen: 32,
                prf: "hmac-sha256"
            }
        };
        let keyObject = keythereum.dump(keyPassword, dk.privateKey, dk.salt, dk.iv, options);
        keythereum.exportToFile(keyObject,config.ethKeyStorePath);
        return keyObject.address;
    },
    createWanAddr(keyPassword) {
        let params = { keyBytes: 32, ivBytes: 16 };
        let options = {
            kdf: "scrypt",
            cipher: "aes-128-ctr",
            kdfparams: {
                n: 8192,
                dklen: 32,
                prf: "hmac-sha256"
            }
        };
        let dk = keythereum.create(params);
        let keyObject = keythereum.dump(keyPassword, dk.privateKey, dk.salt, dk.iv, options);

        let dk2 = keythereum.create(params);
        let keyObject2 = keythereum.dump(keyPassword, dk2.privateKey, dk2.salt, dk2.iv, options);
        keyObject.crypto2 = keyObject2.crypto;

        keyObject.waddress = wanUtil.generateWaddrFromPriv(dk.privateKey, dk2.privateKey).slice(2);
        keythereum.exportToFile(keyObject, config.wanKeyStorePath);
        return keyObject.address;
    },
    getTxHistory(option) {
        this.collection = this.getCrossdbCollection();
        let Data = this.collection.find(option);
        let his = [];
        for(var i=0;i<Data.length;++i){
            let Item = Data[i];
            his.push(Item);
        }
        return his;
    },
    async sendEthHash(sender, tx) {
        let newTrans = this.createTrans(sender);
        newTrans.createTransaction(tx.from, config.originalChainHtlc,tx.amount.toString(),tx.storemanGroup,tx.cross,tx.gas,this.toGweiString(tx.gasPrice.toString()),'ETH2WETH',tx.nonce);
        let txhash =  await pu.promisefy(newTrans.sendLockTrans, [tx.passwd], newTrans);
        return txhash;
    },
    async sendDepositX(sender, from,gas,gasPrice,x, passwd, nonce) {
        let newTrans = this.createTrans(sender);
        newTrans.createTransaction(from, config.wanchainHtlcAddr,null,null,null,gas,this.toGweiString(gasPrice),'ETH2WETH', nonce);
        newTrans.trans.setKey(x);
        let txhash =  await pu.promisefy(newTrans.sendRefundTrans, [passwd], newTrans);
        return txhash;
    },
    async sendEthCancel(sender, from,gas,gasPrice,x, passwd, nonce) {
        let newTrans = this.createTrans(sender);
        newTrans.createTransaction(from, config.originalChainHtlc,null,null,null,gas,this.toGweiString(gasPrice),'ETH2WETH', nonce);
        newTrans.trans.setKey(x);
        let txhash =  await pu.promisefy(newTrans.sendRevokeTrans, [passwd], newTrans);
        return txhash;
    },
    getDepositOrigenLockEvent(sender, hashX) {
        let topics = ['0x'+wanUtil.sha3(config.depositOriginLockEvent).toString('hex'), null, null, hashX];
        let b = pu.promisefy(sender.sendMessage, ['getScEvent', config.originalChainHtlc, topics], sender);
        return b;
    },
    getWithdrawOrigenLockEvent(sender, hashX) {
        let topics = ['0x'+wanUtil.sha3(config.withdrawOriginLockEvent).toString('hex'), null, null, hashX];
        let b = pu.promisefy(sender.sendMessage, ['getScEvent', config.wanchainHtlcAddr, topics], sender);
        return b;
    },
    getWithdrawRevokeEvent(sender, hashX) {
        let topics = ['0x'+wanUtil.sha3(config.withdrawOriginRevokeEvent).toString('hex'), null,  hashX];
        let p = pu.promisefy(sender.sendMessage, ['getScEvent', config.wanchainHtlcAddr, topics], sender);
        return p;
    },
    getWithdrawCrossLockEvent(sender, hashX) {
        let topics = ['0x'+wanUtil.sha3(config.withdrawCrossLockEvent).toString('hex'), null, null, hashX];
        let p = pu.promisefy(sender.sendMessage, ['getScEvent', config.originalChainHtlc, topics], sender);
        return p;
    },
    getDepositCrossLockEvent(sender, hashX) {
        let topics = ['0x'+wanUtil.sha3(config.depositCrossLockEvent).toString('hex'), null, null, hashX];
        let p = pu.promisefy(sender.sendMessage, ['getScEvent', config.wanchainHtlcAddr, topics], sender);
        return p;
    },
    getDepositOriginRefundEvent(sender, hashX) {
        let topics = ['0x'+wanUtil.sha3(config.depositOriginRefundEvent).toString('hex'), null, null, hashX];
        let p = pu.promisefy(sender.sendMessage, ['getScEvent', config.wanchainHtlcAddr, topics], sender);
        return p;
    },
    getWithdrawOriginRefundEvent(sender, hashX) {
        let topics = ['0x'+wanUtil.sha3(config.withdrawOriginRefundEvent).toString('hex'), null, null, hashX];
        let p = pu.promisefy(sender.sendMessage, ['getScEvent', config.originalChainHtlc, topics], sender);
        return p;
    },
    getDepositRevokeEvent(sender, hashX) {
        let topics = ['0x'+wanUtil.sha3(config.depositOriginRevokeEvent).toString('hex'), null,  hashX];
        let p = pu.promisefy(sender.sendMessage, ['getScEvent', config.originalChainHtlc, topics], sender);
        return p;
    },
    getDepositHTLCLeftLockedTime(sender, hashX){
        let p = pu.promisefy(sender.sendMessage, ['callScFunc', config.originalChainHtlc, 'getHTLCLeftLockedTime',[hashX],config.HTLCETHInstAbi], sender);
        return p;
    },
    getWithdrawHTLCLeftLockedTime(sender, hashX){
        let p = pu.promisefy(sender.sendMessage, ['callScFunc', config.wanchainHtlcAddr, 'getHTLCLeftLockedTime',[hashX],config.HTLCWETHInstAbi], sender);
        return p;
    },
    monitorTxConfirm(sender, txhash, waitBlocks) {
        let p = pu.promisefy(sender.sendMessage, ['getTransactionConfirm', txhash, waitBlocks], sender);
        return p;
    },
    getEthLockTime(sender){
        let p = pu.promisefy(sender.sendMessage, ['getScVar', config.originalChainHtlc, 'lockedTime',config.HTLCETHInstAbi], sender);
        return p;
    },
    getEthC2wRatio(sender){
        let p = pu.promisefy(sender.sendMessage, ['getCoin2WanRatio','ETH'], sender);
        return p;
    },
    getEthBalance(sender, addr) {
        let bs = pu.promisefy(sender.sendMessage, ['getBalance',addr], sender);
        return bs;
    },
    getBlockByNumber(sender, blockNumber) {
        let bs = pu.promisefy(sender.sendMessage, ['getBlockByNumber',blockNumber], sender);
        return bs;
    },
    getWanBalance(sender, addr) {
        let bs = pu.promisefy(sender.sendMessage, ['getBalance',addr], sender);
        return bs;
    },
    getEthBalancesSlow(sender, adds) {
        let ps = [];

        // TODO: only support one request one time.
        for(let i=0; i<adds.length; i++) {
            let b = pu.promisefy(sender.sendMessage, ['getBalance',adds[i]], sender);
            ps.push(b);
        }
        return ps;
    },
    calculateLocWanFee(value,coin2WanRatio,txFeeRatio){
        let wei     = web3.toWei(web3.toBigNumber(value));
        const DEFAULT_PRECISE = 10000;
        let fee = wei.mul(coin2WanRatio).mul(txFeeRatio).div(DEFAULT_PRECISE).div(DEFAULT_PRECISE).trunc();

        return '0x'+fee.toString(16);
    },
    async sendWanHash(sender, tx) {
        let newTrans = this.createTrans(sender);
        newTrans.createTransaction(tx.from, config.wanchainHtlcAddr, tx.amount.toString(),tx.storemanGroup,tx.cross,tx.gas,this.toGweiString(tx.gasPrice.toString()),'WETH2ETH',tx.nonce);
        newTrans.trans.setValue(tx.value);
        let txhash =  await pu.promisefy(newTrans.sendLockTrans, [tx.passwd], newTrans);
        return txhash;
    },
    async sendWanX(sender, from,gas,gasPrice,x, passwd, nonce) {
        let newTrans = this.createTrans(sender);
        newTrans.createTransaction( from, config.originalChainHtlc,null,null,null,gas,this.toGweiString(gasPrice),'WETH2ETH',nonce);
        newTrans.trans.setKey(x);
        let txhash =  await pu.promisefy(newTrans.sendRefundTrans, [passwd], newTrans);
        return txhash;
    },
    async sendWanCancel(sender, from,gas,gasPrice,x, passwd,nonce) {
        let newTrans = this.createTrans(sender);
        newTrans.createTransaction( from, config.wanchainHtlcAddr,null,null,null,gas,this.toGweiString(gasPrice),'WETH2ETH',nonce);
        newTrans.trans.setKey(x);
        let txhash =  await pu.promisefy(newTrans.sendRevokeTrans, [passwd], newTrans);
        return txhash;
    },
    getMultiEthBalances(sender, addrs) {
        let bs = pu.promisefy(sender.sendMessage, ['getMultiBalances',addrs], sender);
        return bs;
    },
    getMultiWanBalances(sender, addrs) {
        let bs = pu.promisefy(sender.sendMessage, ['getMultiBalances',addrs], sender);
        return bs;
    },
    getMultiTokenBalance(sender, addrs) {
        let bs = pu.promisefy(sender.sendMessage, ['getMultiTokenBalance',addrs], sender);
        return bs;
    },

    updateStatus(key, Status){
        let value = this.collection.findOne({HashX:key});
        if(value){
            value.status = Status;
            this.collection.update(value);
        }
    },

}

module.exports = Backend;
