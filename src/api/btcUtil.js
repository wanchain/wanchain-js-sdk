'use strict'

const bitcoin   = require('bitcoinjs-lib');
const binConv   = require('binstring');
const wif       = require('wif')
const bip38     = require('bip38')
const crypto    = require('crypto');
const secp256k1 = require('secp256k1');
const Address   = require('btc-address')
const utils     = require('../util/util');

let logger = utils.getLogger('btcUtil.js');
/**
 * ccUtil
 */
const btcUtil = {
    hexTrip0x(hexs) {
       if (0 == hexs.indexOf('0x')) {
           return hexs.slice(2);
       }
       return hexs;
    },

    /**
     * Create a BTC address and insert into wallet
     * @function createBTCAddress 
     * @param {string} keyPassword  - key password
     * @returns {string}            - eth address
     */
    async createBTCAddress(keyPassword) {
        try {
            let btcAddress = this.getBtcWallet();
            if (Array.isArray(btcAddress) && (btcAddress.length > 0)) {
                let result = btcAddress[0];

                // ?? why do this?
                let encryptedKey = result.encryptedKey;
                await this.decryptedWIF(encryptedKey, keyPassword);
            }

            let config = utils.getConfigSetting('sdk:config', undefined);

            const keyPair = bitcoin.ECPair.makeRandom({
                network: config.bitcoinNetwork,
                rng: () => Buffer.from(crypto.randomBytes(32))
            })
            const {address} = await bitcoin.payments.p2pkh({pubkey: keyPair.publicKey, 
                                                            network: config.bitcoinNetwork});
            const privateKey = keyPair.toWIF();
            const decoded = wif.decode(privateKey, config.bitcoinNetwork.wif);
            const encrypted = await bip38.encrypt(decoded.privateKey, decoded.compressed, keyPassword);

            let newAddress = {address: address, encryptedKey: encrypted}
             global.btcWalletDB.insertAddress(newAddress);
            return newAddress
        } catch (err) {
            //if (err.code === 'ERR_ASSERTION') {
            //    console.log('password wrong!')
            //} else {
            //    console.log('err: ', err)
            //}
            return null
        }
    },

    /**
     * convert the hash160 to bitcoin address
     * @param {string} hash160 the h160 address
     * @param {string} addressType the  address typr. 'pubkeyhash'
     * @param {string} network the bitcoin network. 'mainnet' | 'testnet'
     */
    hash160ToAddress (hash160, addressType, network) {
        var address = new Address(binConv(this.hexTrip0x(hash160), {in: 'hex', out: 'bytes'}), addressType, network)
        return address.toString()
    },
/**
     * convert the  bitcoin address to hash160
     * @param {string} address the bitcoin address
     * @param {string} addressType the  address typr. 'pubkeyhash'
     * @param {string} network the bitcoin network. 'mainnet' | 'testnet'
     */
    addressToHash160 (address, addressType, network) {  //'pubkeyhash','testnet'
        var address = new Address(address, addressType, network)
        return binConv(address.hash, {in: 'bytes', out: 'hex'})
    },
    /**
     */
    getBtcWallet () {
        return global.btcWalletDB.getAddresses();
    },

    /**
     * Deprecated !!!
     */
    getAddressList() { return this.getBtcWallet(); },

    /**
     * the the btc address by ecPair.
     * @param {Object} keypair the btc ecpair.
     */
    getAddressbyKeypair(keypair) {
        let config = utils.getConfigSetting('sdk:config', undefined);
        const pkh = bitcoin.payments.p2pkh({pubkey: keypair.publicKey, network: config.bitcoinNetwork});
        return pkh.address;
    },

    /**
     */
    async decryptedWIF (encrypted, pwd) {
        let decryptedKey = await bip38.decrypt(encrypted, pwd)
        let config = utils.getConfigSetting('sdk:config', undefined);
        let privateKeyWif = await wif.encode(config.bitcoinNetwork.wif, decryptedKey.privateKey, decryptedKey.compressed)

        return privateKeyWif;
    },

    /**
     * Deprecated!!!
     *
     * get all the keyPair in the wallet
     * @param {string} passwd the wallet password.
     * @param {string} addr  the bitcoin address
     */
    async getECPairsbyAddr (passwd, addr) {
        let addrArray = this.getAddressList();
        let encryptedKeyResult = addrArray.filter(
                function match(a) {
                    if (addr) {
                        return a.address == addr;
                    }
                    return true;
                }); 

        let ECPairArray = [];
        let config = utils.getConfigSetting('sdk:config', undefined);
        try {
            for (let i = 0; i < encryptedKeyResult.length; i++) {
                let privateKeyWif = await this.decryptedWIF(encryptedKeyResult[i].encryptedKey, passwd);
                let alice = await bitcoin.ECPair.fromWIF(privateKeyWif, config.bitcoinNetwork);
                ECPairArray.push(alice);
            }
            if (addr) {
                return ECPairArray[0];
            } else {
                return ECPairArray;
            }
        } catch (err) {
            // TODO: comment out
            //if (err.code === 'ERR_ASSERTION') {
            //    console.log('password wrong!')
            //} else {
            //    console.log('err: ', err)
            //}
            return ECPairArray
        }
        return ECPairArray
    },

    hashtimelockcontract (hashx, redeemLockTimeStamp, destHash160Addr, revokerHash160Addr) {
        let redeemScript = bitcoin.script.compile([
            /* MAIN IF BRANCH */
            bitcoin.opcodes.OP_IF,
            bitcoin.opcodes.OP_SHA256,
            Buffer.from(hashx, 'hex'),
            bitcoin.opcodes.OP_EQUALVERIFY,
            bitcoin.opcodes.OP_DUP,
            bitcoin.opcodes.OP_HASH160,

            Buffer.from(this.hexTrip0x(destHash160Addr), 'hex'),//bitcoin.crypto.hash160(storeman.publicKey),
            //bitcoin.crypto.hash160(storeman.publicKey),
            bitcoin.opcodes.OP_ELSE,
            bitcoin.script.number.encode(redeemLockTimeStamp),
            bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY,
            bitcoin.opcodes.OP_DROP,
            bitcoin.opcodes.OP_DUP,
            bitcoin.opcodes.OP_HASH160,

            Buffer.from(this.hexTrip0x(revokerHash160Addr), 'hex'),
            bitcoin.opcodes.OP_ENDIF,

            bitcoin.opcodes.OP_EQUALVERIFY,
            bitcoin.opcodes.OP_CHECKSIG
        ])
        //logger.debug('redeemScript:' + redeemScript.toString('hex'))

        let config = utils.getConfigSetting('sdk:config', undefined);

        let addressPay = bitcoin.payments.p2sh({
            redeem: {output: redeemScript, network: config.bitcoinNetwork},
            network: config.bitcoinNetwork 
        })
        let address = addressPay.address

        return {
            'p2sh': address,
            'hashx': hashx,
            'redeemLockTimeStamp': redeemLockTimeStamp,
            'redeemScript': redeemScript
        }

    },

    /**
     */
    filterUTXO(utxos, amount) {
        let addrUtxo = {};
        for (let i=0; i<utxos.length; i++) {
            let utxo = utxos[i];
            if (addrUtxo.hasOwnProperty(utxo.address)) {
                addrUtxo[utxo.address].amount += utxo.value;
                addrUtxo[utxo.address].utxos.push(utxo);
            } else {
                addrUtxo[utxo.address] = {
                    "amount" : utxo.value,
                    "utxos" : [ utxo ]
                }
            }
        }

        let addrList = [];
        for (let addr in addrUtxo) {
            addrList.push( {
                'address': addr,
                'balance': Number(utils.toBigNumber(addrUtxo[addr].amount).div(100000000).toString())
            });
        }

        // Sort by balance
        addrList = addrList.sort((a, b) => {
            return b.balance - a.balance;
        });

        let retUtxo = [];
        let total = 0;
        for (let i = 0; i < addrList.length; i++) {
            total += addrList[i].balance;

            let utxo = addrUtxo[addrList[i].address].utxos;
            retUtxo = retUtxo.concat(utxo);

            if (total > Number(amount)) {
                break;
            }
        }

        return retUtxo;

    }

}

module.exports = btcUtil;
