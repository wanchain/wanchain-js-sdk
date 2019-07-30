/**
 * WAN naming service interface
 *
 * Copyright (c)2019, all rights reserved.
 */

var web3util = require('../util/web3util');
let utils = require('../util/util');
let error = require('../api/error');

const WANContract = require('./wancontract');

let logger = utils.getLogger('auctionRegistrar.js');

var web3 = web3util.getWeb3Instance();

class AuctionRegistrar extends WANContract {
    constructor(wns) {
        let abi = utils.getConfigSetting('sdk:config:contract:wns:auctionRegistrar:abi', undefined);
        let addr = utils.getConfigSetting('sdk:config:contract:wns:auctionRegistrar:address', undefined);
        if (typeof abi !== 'object' || typeof addr !== 'string') {
            logger.error("Sorry, we don't have auction registrar definition!");
            throw new error.LogicError("No auction definition!");
        }

        super(abi, addr);
        this.wns = wns
    }

    // Auction status
    entries(name) {
        if (!name) {
            logger.error("entries: missing required parameter [name]");
            throw new error.InvalidParameter("Missing required parameter [name]");
        }
        let myname = web3.utils.sha3(name);
        let e = this.call('entries', myname);
        return e;
    }

    // Get allowed time
    getAllowedTime(name) {
        if (!name) {
            logger.error("getAllowedTime: missing required parameter [name]");
            throw new error.InvalidParameter("Missing required parameter [name]");
        }
        let myname = web3.utils.sha3(name);
        let t = this.call('getAllowedTime', myname);

        return t;
    }

    // sealed bid
    // value - unit wei
    // salt - web3.utils.sha3(secret)
    shaBid(name, owner, value, salt) {
        if (!name) {
            logger.error("shaBid: missing required parameter [name]");
            throw new error.InvalidParameter("Missing required parameter [name]");
        }

        if (!owner) {
            logger.error("shaBid: missing required parameter [owner]");
            throw new error.InvalidParameter("Missing required parameter [owner]");
        }

        if (typeof value !== 'string') {
            logger.error("shaBid: invalid parameter [value]");
            throw new error.InvalidParameter("Invalid parameter [value]");
        }

        if (!salt) {
            logger.error("shaBid: missing required parameter [salt]");
            throw new error.InvalidParameter("Missing required parameter [salt]");
        }

        let myname = web3.utils.sha3(name);
        return this.call('shaBid', myname, owner, value, salt);
    }

    // Start auction
    async startAuction(name, txinfo) {
        if (!name) {
            logger.error("startAuction: missing required parameter [name]");
            throw new error.InvalidParameter("Missing required parameter [name]");
        }

        if (typeof txinfo !== 'object') {
            logger.error("startAuction: invalid parameter [txinfo]");
            throw new error.InvalidParameter("Invalid parameter [txinfo]");
        }

        let myname = web3.utils.sha3(name);
        let txhash = await this.send('startAuction', txinfo, myname);

        return txhash;
    }

    // Auction & Bid register
    async startAuctionsAndBid(name, bid, txinfo) {
        if (!name) {
            logger.error("startAuctionsAndBid: missing required parameter [name]");
            throw new error.InvalidParameter("Missing required parameter [name]");
        }

        if (!bid) {
            logger.error("startAuctionsAndBid: missing required parameter [bid]");
            throw new error.InvalidParameter("Missing required parameter [bid]");
        }

        if (typeof txinfo !== 'object') {
            logger.error("startAuctionsAndBid: invalid parameter [txinfo]");
            throw new error.InvalidParameter("Invalid parameter [txinfo]");
        }

        let myname = web3.utils.sha3(name);
        let txhash = await this.send('startAuctionsAndBid', txinfo, myname, bid);

        return txhash;
    }

    // New Bid
    async newBid(bid, txinfo) {
        if (!bid) {
            logger.error("newBid: missing required parameter [bid]");
            throw new error.InvalidParameter("Missing required parameter [bid]");
        }

        if (typeof txinfo !== 'object') {
            logger.error("newBid: invalid parameter [txinfo]");
            throw new error.InvalidParameter("Invalid parameter [txinfo]");
        }

        let txhash = await this.send('newBid', txinfo, bid);

        return txhash;
    }

    // Reveal bid
    // value - unit wei
    // salt - web3.utils.sha3(secret)
    async unsealBid(name, value, salt, txinfo) {
        if (!name) {
            logger.error("unsealBid: missing required parameter [name]");
            throw new error.InvalidParameter("Missing required parameter [name]");
        }

        if (typeof value === 'undefined') {
            logger.error("unsealBid: invalid parameter [value]");
            throw new error.InvalidParameter("Invalid parameter [value]");
        }

        if (!salt) {
            logger.error("unsealBid: missing required parameter [salt]");
            throw new error.InvalidParameter("Missing required parameter [salt]");
        }

        if (typeof txinfo !== 'object') {
            logger.error("unsealBid: invalid parameter [txinfo]");
            throw new error.InvalidParameter("Invalid parameter [txinfo]");
        }

        let myname = web3.utils.sha3(name);
        return await this.send('unsealBid', txinfo, myname, value, salt);
    }

    // Cancel bid
    async cancelBid(bider, bid, txinfo) {
        if (!bider) {
            logger.error("cancelBid: missing required parameter [bider]");
            throw new error.InvalidParameter("Missing required parameter [bider]");
        }

        if (!bid) {
            logger.error("cancelBid: missing required parameter [bid]");
            throw new error.InvalidParameter("Missing required parameter [bid]");
        }

        if (typeof txinfo !== 'object') {
            logger.error("finalizeAuction: invalid parameter [txinfo]");
            throw new error.InvalidParameter("Invalid parameter [txinfo]");
        }

        let txhash = await this.send('cancelBid', txinfo, bider, bid);

        return txhash;
    }

    // Check auction winner, for deed contract

    // Finalize auction
    async finalizeAuction(name, txinfo) {
        if (!name) {
            logger.error("finalizeAuction: missing required parameter [name]");
            throw new error.InvalidParameter("Missing required parameter [name]");
        }

        if (typeof txinfo !== 'object') {
            logger.error("finalizeAuction: invalid parameter [txinfo]");
            throw new error.InvalidParameter("Invalid parameter [txinfo]");
        }

        let myname = web3.utils.sha3(name);
        let txhash = await this.send('finalizeAuction', txinfo, myname);

        return txhash;
    }

    //
    // Transfer DEED ownership
    // Caution!
    //     Transferring the deed is irrevocable!
    async transfer(name, newOwner, txinfo) {
        if (!name) {
            logger.error("transfer: missing required parameter [name]");
            throw new error.InvalidParameter("Missing required parameter [name]");
        }

        if (!newOwner) {
            logger.error("transfer: missing required parameter [newOwner]");
            throw new error.InvalidParameter("Missing required parameter [newOwner]");
        }

        if (typeof txinfo !== 'object') {
            logger.error("transfer: invalid parameter [txinfo]");
            throw new error.InvalidParameter("Invalid parameter [txinfo]");
        }

        let myname = web3.utils.sha3(name);
        let txhash = await this.send('transfer', txinfo, myname, newOwner);

        return txhash;

    }

    // Release deed after expiry
    async releaseDeed(name, txinfo) {
        if (!name) {
            logger.error("releaseDeed: missing required parameter [name]");
            throw new error.InvalidParameter("Missing required parameter [name]");
        }
        let myname = web3.utils.sha3(name);
        let txhash = await this.send('releaseDeed', txinfo, myname);

        return txhash;
    }
};

module.exports = AuctionRegistrar;
