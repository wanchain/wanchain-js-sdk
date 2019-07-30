/**
 * WAN naming service interface
 *
 * Copyright (c)2019, all rights reserved.
 */
'use strict'

let utils = require('../util/util');
let ccUtil = require('../api/ccUtil');
var web3util = require('../util/web3util');
let error = require('../api/error');
let wnsutils = require('./util');

var web3 = web3util.getWeb3Instance();


let Registry = require('./registry.js');
let PublicResolver= require('./publicResolver');
let TestRegistrar = require('./testRegistrar');
let AuctionRegistrar = require('./auctionRegistrar');
let DeepRegistrar = require('./deedRegistrar');
//let ReverseRegistrar = require('./deedRegistrar');

let logger = utils.getLogger('wns.js');

const RESOLVER_INTF_GETADDR = 0x3b3b57de;
const RESOLVER_INTF_NAME    = 0x691f3431;
const RESOLVER_INTF_ABI     = 0x2203ab56;
const RESOLVER_INTF_PUBKEY  = 0xc8690233;

const AUCTION_STATUS = {
    0 : "Available",
    1 : "Started",
    2 : "Sold",
    3 : "Forbidden",
    4 : "Reveal",
    5 : "SoftLaunch"
};

class WNS {
    constructor() {
        this._initWNSContracts();
    }

    _initWNSContracts() {
        this.getRegistry();
        this.getPublicResolver();
        this.getTestRegistrar();
        this.getAuctionRegistrar();
        this.getDeepRegistrar();
        //this.getReverseRegistrar();
    }

    /**
     * Resolution
     */
    getRegistry() {
        if (!this.registry) {
            this.registry = new Registry();
        }

        return this.registry;
    }

    getPublicResolver() {
        if (!this.public) {
            this.public = new PublicResolver();
        }

        return this.public;
    }

    getTestRegistrar() {
        if (utils.isOnMainNet() == true) {
            logger.warn("Running on mainnet, test registrar not support!");
            return null;
        }

        if (!this.test) {
            this.test = new TestRegistrar();
        }

        return this.test;
    }

    getAuctionRegistrar() {
        if (!this.auction) {
            this.auction = new AuctionRegistrar();
        }

        return this.auction;
    }

    getDeepRegistrar() {
        if (!this.deep) {
            this.deep = new DeepRegistrar("");
        }

        return this.deep;
    }

    getReverseRegistrar() {

    }

    /**
     * get address for given name
     */
    async getAddr(name) {
        let resolverAddr = await this.getRegistry().resolver(name);
        if (resolverAddr === '0x0000000000000000000000000000000000000000') {
            return "0x0000000000000000000000000000000000000000000000000000000000000000";
        }

        logger.debug("Resolver address for '%s': %s", name, resolverAddr);

        let resolver = this.getPublicResolver();
        let myres = resolver.at(resolverAddr);
        let isSupport = await myres.supportsInterface(RESOLVER_INTF_GETADDR);
        if (!isSupport) {
            logger.error("Resolver not support interface 'addr'!");
            throw new error.NotSupport("Resolver not support interface 'addr'!");
        }

        return await myres.address(name);
    }

    /**
     * Register a name on test registrar
     * @param name - string
     * @param owner - address
     *
     * returns register tx hash
     */
    async setResolver(name, resolver, txinfo) {
        //
        let registry = this.getRegistry();
        let tx = await registry.setResolver(name, resolver, txinfo);
        return tx;
    }

    async setAddr(name, resolverAddr, address, txinfo) {
        let resolver = this.getPublicResolver();
        let myres = resolver.at(resolverAddr);
        let isSupport = await myres.supportsInterface(RESOLVER_INTF_GETADDR);
        if (!isSupport) {
            logger.error("Resolver not support interface 'addr'!");
            throw new error.NotSupport("Resolver not support interface 'addr'!");
        }

        return await myres.setAddr(name, address, txinfo);
    }

    async auctionEntries(name) {
        let auction = this.getAuctionRegistrar();
        let e = await auction.entries(name);
        let res = {
            'status' : {
                'code' :  e[0],
                'msg' : AUCTION_STATUS[e[0]]
            },
            'endDate' : new Date(e[2] * 1000),
            'bidWinner' : e[1],
            'bidValue' : e[4],
            'entries' : e
        }

        return res;
    }


    async getAuctionAllowedTime(name) {
        let auction = this.getAuctionRegistrar();
        let t = await auction.getAllowedTime(name);

        return new Date(t*1000);
    }

    async startAuction(name, txinfo) {
        let auction = this.getAuctionRegistrar();
        let tx = await auction.startAuction(name, txinfo);

        return tx;
    }

    async startAuctionsAndBid(name, bid, txinfo) {
        let auction = this.getAuctionRegistrar();
        let tx = await auction.startAuctionsAndBid(name, bid, txinfo);

        return tx;

    }

    async finalizeAuction(name, txinfo) {
        let auction = this.getAuctionRegistrar();
        let tx = await auction.finalizeAuction(name, txinfo);

        return tx;
    }

    async getBidWinner(name) {
        let info = await this.auctionEntries(name);
        let deed = this.getDeepRegistrar();
        return await deed.at(info.winBidder).owner();
    }

    async transferDeed(name, newDeedAddr, txinfo) {
        let auction = this.getAuctionRegistrar();
        return await auction.transfer(name, newDeedAddr, txinfo);
    }

    //
    // release after expiration
    async releaseDeed(name, txinfo) {
        let auction = this.getAuctionRegistrar();
        return await auction.releaseDeed(name, txinfo);
    }
    /**
     * Seal bid
     *
     * @param value: WAN
     * @param salt: web3.utils.sha3(secret)
     */
    async shaBid(name, owner, value, secret) {
        //
        let auction = this.getAuctionRegistrar();

        if (!secret) {
            logger.error("shaBid: missing required parameter [secret]")
            throw new error.InvalidParameter("Missing required parameter [secret]");
        }

        let valuewei = ccUtil.tokenToWeiHex(value, 18);
        let salt = web3.utils.sha3(secret);
        let bid = auction.shaBid(name, owner, valuewei, salt);

        return bid;
    }

    async unsealBid(name, value, secret, txinfo) {
        let auction = this.getAuctionRegistrar();
        if (!secret) {
            logger.error("unsealBid: missing required parameter [secret]")
            throw new error.InvalidParameter("Missing required parameter [secret]");
        }

        let valuewei = ccUtil.tokenToWeiHex(value, 18);
        let salt = web3.utils.sha3(secret);
        let tx = auction.unsealBid(name, valuewei, salt, txinfo);

        return tx;
    }

    async newBid(bid, txinfo) {
        let auction = this.getAuctionRegistrar();
        let tx = await auction.newBid(bid, txinfo);

        return tx;
    }

    async cancelBid(bider, bid, txinfo) {
        let auction = this.getAuctionRegistrar();
        let tx = await auction.cancelBid(bider, bid, txinfo);

        return tx;
    }

    /**
     * Sub-domain management
     */
    async setSubnodeOwner(name, label, owner, txinfo) {
        let registry = this.getRegistry();
        let tx = await registry.setSubnodeOwner(name, label, owner, txinfo);
        return tx;
    }

    /**
     * Manage ownership
     */
    async setOwner(name, newowner, txinfo) {
        let registry = this.getRegistry();
        let tx = await registry.setOwner(name, newowner, txinfo);
        return tx;
    }
    /**
     * Get expiry time on test registrar!
     *
     * return seconds since epoch!
     */
    async getTestExpiryTime(name) {
        if (utils.isOnMainNet() == true) {
            logger.error("Test registrar not support on main net!");
            throw new error.NotSupport("Test registrar not support on main net!");
        }

        let test = this.getTestRegistrar();
        let t = await test.expiryTimes(name);

        return new Date(t*1000);
    }

    /**
     * Register a name on test registrar
     * @param name - string
     * @param owner - address
     *
     * returns register tx hash
     */
    async registerTest(name, owner, txinfo) {
        //
        let d = await this.getTestExpiryTime(name);
        let now = Date.now();
        if (d.getTime() > now) {
            logger.error("Registering name %s is not available until %s!", name, d);
            throw new error.RuntimeError("Register name is not available!");
        }

        let test = this.getTestRegistrar();
        let tx = await test.register(name, owner, txinfo);
        return tx;
    }
};

module.exports = WNS;
