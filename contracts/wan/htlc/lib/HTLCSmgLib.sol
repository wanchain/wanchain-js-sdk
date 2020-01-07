/*

  Copyright 2019 Wanchain Foundation.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

//                            _           _           _
//  __      ____ _ _ __   ___| |__   __ _(_)_ __   __| | _____   __
//  \ \ /\ / / _` | '_ \ / __| '_ \ / _` | | '_ \@/ _` |/ _ \ \ / /
//   \ V  V / (_| | | | | (__| | | | (_| | | | | | (_| |  __/\ V /
//    \_/\_/ \__,_|_| |_|\___|_| |_|\__,_|_|_| |_|\__,_|\___| \_/
//
//

pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;


import "../../lib/QuotaLib.sol";
import "./HTLCLib.sol";
import "./commonLib.sol";
import "./HTLCTypes.sol";
import "../../interfaces/ITokenManager.sol";

library HTLCSmgLib {
    using SafeMath for uint;
    using QuotaLib for QuotaLib.Data;
    using HTLCLib for HTLCLib.Data;

    /**
     *
     * STRUCTURES
     *
     */
    /// @notice struct of HTLC storeman lock parameters
    struct HTLCSmgLockParams {
        bytes tokenOrigAccount;         /// token account on original chain
        bytes32 xHash;                  /// hash of HTLC random number
        address wanAddr;                /// user address which is used for user to redeem value
        uint value;                     /// token value
        bytes storemanGroupPK;          /// PK of storeman group which user has selected
        bytes r;                        /// R in schnorr signature
        bytes32 s;                      /// s in schnorr signature
    }
    /// @notice struct of HTLC storeman redeem parameters
    struct HTLCSmgRedeemParams {
        ITokenManager tokenManager;     /// interface of token manager
        bytes32 x;                      /// HTLC random number
    }

    /**
     *
     * EVENTS
     *
     **/

    /// @notice                         event of exchange WRC-20 token with original chain token request
    /// @notice                         event invoked by storeman group
    /// @param wanAddr                  address of wanchain, used to receive WRC-20 token
    /// @param xHash                    hash of HTLC random number
    /// @param value                    HTLC value
    /// @param tokenOrigAccount         account of original chain token
    /// @param storemanGroupPK          PK of storemanGroup
    event InboundLockLogger(address indexed wanAddr, bytes32 indexed xHash, uint value, bytes tokenOrigAccount, bytes storemanGroupPK);

    /// @notice                         event of revoke exchange WRC-20 token with original chain token HTLC transaction
    /// @notice                         event invoked by storeman revoke
    /// @param xHash                    hash of HTLC random number
    /// @param tokenOrigAccount         account of original chain token
    /// @param storemanGroupPK          PK of storemanGroup
    event InboundRevokeLogger(bytes32 indexed xHash, bytes tokenOrigAccount, bytes storemanGroupPK);

    /// @notice                         event of refund WRC-20 token from exchange original chain token with WRC-20 token HTLC transaction
    /// @notice                         event invoked by storeman redeem
    /// @param hashX                    hash of HTLC random number
    /// @param x                        HTLC random number
    /// @param tokenOrigAccount         account of original chain token
    /// @param fee                      fee of user outbound lock
    event OutboundRedeemLogger(bytes32 indexed hashX, bytes32 indexed x, bytes tokenOrigAccount,uint fee);

    /// @notice                         event of storeman group pk withdraw wan coin to receiver
    /// @param storemanGroupPK          PK of storemanGroup
    /// @param receiver                 receiver address
    /// @param timeStamp                timestamp of the withdraw
    /// @param fee                      wan coin of the fee which the storeman group pk got it
    event SmgWithdrawFeeLogger(address indexed receiver, bytes storemanGroupPK, uint timeStamp, uint fee);


    /**
     *
     * MANIPULATIONS
     *
     */

    /// @notice                         inbound, storeman lock token on wanchain
    /// @notice                         event invoked by storeman lock
    /// @param htlcStorageData          HTLC storage data
    /// @param params                   parameters for storeman group lock token on wanchain
    function inSmgLock(HTLCTypes.HTLCStorageData storage htlcStorageData, HTLCSmgLockParams memory params)
        public
    {
        bytes32 mHash = sha256(abi.encode(params.tokenOrigAccount, params.xHash, params.wanAddr, params.value));
        commonLib.verifySignature(mHash, params.storemanGroupPK, params.r, params.s);

        htlcStorageData.htlcData.addSmgTx(params.xHash, params.value, params.wanAddr, params.storemanGroupPK,params.tokenOrigAccount);
        htlcStorageData.quotaData.inLock(params.tokenOrigAccount, params.storemanGroupPK, params.value);

        emit InboundLockLogger(params.wanAddr, params.xHash, params.value, params.tokenOrigAccount, params.storemanGroupPK);
    }

    /// @notice                         outbound, storeman redeem token on wanchain which invokes burn token on wanchain
    /// @param htlcStorageData          HTLC storage data
    /// @param params                   parameters for storeman group redeem token on wanchain
    function outSmgRedeem(HTLCTypes.HTLCStorageData storage htlcStorageData, HTLCSmgRedeemParams memory params)
        public
    {
        bytes32 xHash = htlcStorageData.htlcData.redeemUserTx(params.x);

        uint value;
        bytes memory storemanGroupPK;
        bytes memory tokenOrigAccount;
        (, , value, storemanGroupPK,tokenOrigAccount) = htlcStorageData.htlcData.getUserTx(xHash);

        htlcStorageData.quotaData.outRedeem(tokenOrigAccount, storemanGroupPK, value);

        params.tokenManager.burnToken(tokenOrigAccount, value);

        // Add fee to storeman group
        htlcStorageData.mapStoremanFee[storemanGroupPK].add(htlcStorageData.mapXHashFee[xHash]);

        emit OutboundRedeemLogger(xHash, params.x, tokenOrigAccount, htlcStorageData.mapXHashFee[xHash]);
        delete htlcStorageData.mapXHashFee[xHash];
    }

    /// @notice                         inbound, storeman revoke transaction on wanchain
    /// @param htlcStorageData          HTLC storage data
    /// @param xHash                    hash of HTLC random number
    function inSmgRevoke(HTLCTypes.HTLCStorageData storage htlcStorageData, bytes32 xHash)
        public
    {
        htlcStorageData.htlcData.revokeSmgTx(xHash);

        uint value;
        bytes memory storemanGroupPK;
        bytes memory tokenOrigAccount;
        (, value, storemanGroupPK,tokenOrigAccount) = htlcStorageData.htlcData.getSmgTx(xHash);

        // Anyone could do revoke for the owner
        // bytes32 mHash = sha256(abi.encode(tokenOrigAccount, xHash));
        // commonLib.verifySignature(mHash, storemanGroupPK, r, s);

        htlcStorageData.quotaData.inRevoke(tokenOrigAccount, storemanGroupPK, value);

        emit InboundRevokeLogger(xHash, tokenOrigAccount, storemanGroupPK);
    }

    /// @notice                         storeman group withdraw the fee of transaction to the receiver
    /// @param htlcStorageData          HTLC storage data
    /// @param storemanGroupPK          PK of the storeman group
    /// @param receiver                 the account for receiving the fee
    /// @param r                        R in schnorr signature
    /// @param s                        s in schnorr signature
    function smgWithdrawFee(HTLCTypes.HTLCStorageData storage htlcStorageData, bytes storemanGroupPK, uint timeStamp, address receiver, bytes r, bytes32 s)
        public
    {
        commonLib.verifySignature(sha256(abi.encode(timeStamp,receiver)), storemanGroupPK, r, s);
        receiver.transfer(htlcStorageData.mapStoremanFee[storemanGroupPK]);

        emit SmgWithdrawFeeLogger(receiver, storemanGroupPK, now, htlcStorageData.mapStoremanFee[storemanGroupPK]);
        delete htlcStorageData.mapStoremanFee[storemanGroupPK];
    }

}
