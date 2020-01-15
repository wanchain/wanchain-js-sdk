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
import "./HTLCTypes.sol";
import "../../interfaces/ITokenManager.sol";
import "../../interfaces/IWRC20Protocol.sol";

library HTLCUserLib {
    using SafeMath for uint;
    using QuotaLib for QuotaLib.Data;
    using HTLCLib for HTLCLib.Data;

    /**
    *
    * STRUCTURES
    *
    */

    /// @notice struct of HTLC user lock parameters
    struct HTLCUserLockParams {
        bytes32 xHash;                  /// hash of HTLC random number
        uint value;                     /// exchange token value
        bytes tokenOrigAccount;         /// token account on original chain
        bytes userOrigAccount;          /// account of original chain, used to receive token
        bytes storemanGroupPK;          /// PK of storeman group which user has selected
        ITokenManager tokenManager;     /// interface of token manager
    }

    /// @notice struct of HTLC user redeem parameters
    struct HTLCUserRedeemParams {
        ITokenManager tokenManager;     /// interface of token manager
        bytes32 x;                     /// HTLC random number
    }

    /// @notice struct of HTLC user revoke parameters
    struct HTLCUserRevokeParams {
        ITokenManager tokenManager;     /// interface of token manager
        bytes32 xHash;                 /// hash of HTLC random number
    }

    /**
     *
     * EVENTS
     *
     **/


    /// @notice                         event of exchange original chain token with WRC-20 token request
    /// @param xHash                    hash of HTLC random number
    /// @param value                    exchange value
    /// @param userOrigAccount          account of original chain, used to receive token
    /// @param storemanGroupPK          PK of storemanGroup, which user selected
    event OutboundLockLogger(bytes32 indexed xHash, uint value, bytes tokenOrigAccount, bytes userOrigAccount, bytes storemanGroupPK);

    /// @notice                         event of refund WRC-20 token from exchange WRC-20 token with original chain token HTLC transaction
    /// @param wanAddr                  address of user on wanchain, used to receive WRC-20 token
    /// @param xHash                    hash of HTLC random number
    /// @param x                        HTLC random number
    /// @param storemanGroupPK          PK of storeman, the WRC-20 token minter
    /// @param tokenOrigAccount         account of original chain token
    event InboundRedeemLogger(address indexed wanAddr, bytes32 indexed xHash, bytes32 indexed x, bytes storemanGroupPK, bytes tokenOrigAccount);

    /// @notice                         event of revoke exchange original chain token with WRC-20 token HTLC transaction
    /// @param wanAddr                  address of user
    /// @param xHash                    hash of HTLC random number
    /// @param tokenOrigAccount         account of original chain token
    /// @param revokeFee                revoke fee of outbound user revoke
    event OutboundRevokeLogger(address indexed wanAddr, bytes32 indexed xHash, bytes tokenOrigAccount, uint revokeFee);

    /**
    *
    * MANIPULATIONS
    *
    */

    /// @notice                         outbound, user lock token on wanchain
    /// @notice                         event invoked by user lock
    /// @param htlcStorageData          HTLC storage data
    /// @param params                   parameters for user lock token on wanchain
    function outUserLock(HTLCTypes.HTLCStorageData storage htlcStorageData, HTLCUserLockParams memory params)
        public
    {
        // check withdraw fee
        uint fee = getOutboundFee(htlcStorageData, params.tokenOrigAccount, params.storemanGroupPK, params.value);

        uint left = (msg.value).sub(fee);
        if (left != 0) {
            (msg.sender).transfer(left);
        }

        htlcStorageData.htlcData.addUserTx(params.xHash, params.value, params.userOrigAccount, params.storemanGroupPK,params.tokenOrigAccount);

        htlcStorageData.quotaData.outLock(params.value, params.tokenOrigAccount, params.storemanGroupPK);

        address instance;
        (,,,instance,,,,) = params.tokenManager.getTokenInfo(params.tokenOrigAccount);
        require(IWRC20Protocol(instance).transferFrom(msg.sender, this, params.value), "Lock token failed");

        htlcStorageData.mapXHashFee[params.xHash] = fee; // in wan coin
        emit OutboundLockLogger(params.xHash, params.value, params.tokenOrigAccount, params.userOrigAccount, params.storemanGroupPK);
    }

    /// @notice                         inbound, user redeem token on wanchain
    /// @notice                         event invoked by user redeem
    /// @param htlcStorageData          HTLC storage data
    /// @param params                   parameters for user redeem token on wanchain
    function inUserRedeem(HTLCTypes.HTLCStorageData storage htlcStorageData, HTLCUserRedeemParams memory params)
        public
    {
        bytes32 xHash = htlcStorageData.htlcData.redeemSmgTx(params.x);

        address userAddr;
        uint value;
        bytes memory storemanGroupPK;
        bytes memory tokenOrigAccount;
        (userAddr, value, storemanGroupPK,tokenOrigAccount) = htlcStorageData.htlcData.getSmgTx(xHash);

        htlcStorageData.quotaData.inRedeem(tokenOrigAccount, storemanGroupPK, value);

        params.tokenManager.mintToken(tokenOrigAccount, userAddr, value);

        emit InboundRedeemLogger(userAddr, xHash, params.x, storemanGroupPK, tokenOrigAccount);
    }

    /// @notice                         outbound, user revoke token on wanchain
    /// @notice                         event invoked by user revoke
    /// @param htlcStorageData          HTLC storage data
    /// @param params                   parameters for user revoke token on wanchain
    function outUserRevoke(HTLCTypes.HTLCStorageData storage htlcStorageData, HTLCUserRevokeParams memory params)
        public
    {
        address source;
        uint value;
        bytes memory storemanGroupPK;
        bytes memory tokenOrigAccount;
        address instance;

        htlcStorageData.htlcData.revokeUserTx(params.xHash);

        (source, , value, storemanGroupPK,tokenOrigAccount) = htlcStorageData.htlcData.getUserTx(params.xHash);

        htlcStorageData.quotaData.outRevoke(tokenOrigAccount, storemanGroupPK, value);

        (,,,instance,,,,) = params.tokenManager.getTokenInfo(tokenOrigAccount);
        require(IWRC20Protocol(instance).transfer(source, value), "Transfer token failed");

        uint revokeFeeRatio = htlcStorageData.revokeFeeRatio;
        uint ratioPrecise = HTLCTypes.getRatioPrecise();
        uint revokeFee = htlcStorageData.mapXHashFee[params.xHash].mul(revokeFeeRatio).div(ratioPrecise);
        uint left = htlcStorageData.mapXHashFee[params.xHash].sub(revokeFee);

        if (revokeFee > 0) {
            value = htlcStorageData.mapStoremanFee[storemanGroupPK];
            htlcStorageData.mapStoremanFee[storemanGroupPK] = value.add(revokeFee);
        }

        if (left > 0) {
            source.transfer(left);
        }

        delete htlcStorageData.mapXHashFee[params.xHash];
        emit OutboundRevokeLogger(source, params.xHash, tokenOrigAccount, revokeFee);
    }

    /// @notice                         get outbound fee for user to lock token on wanchain
    /// @param htlcStorageData          HTLC storage data
    /// @param tokenOrigAccount         account of original chain token
    /// @param storemanGroupPK          PK of storemanGroup
    /// @param value                    HTLC exchange token value
    function getOutboundFee(HTLCTypes.HTLCStorageData storage htlcStorageData, bytes tokenOrigAccount, bytes storemanGroupPK, uint value)
        private
        returns(uint)
    {
        uint8 decimals;
        uint token2WanRatio;
        uint defaultPrecise;
        uint txFeeRatio;
        (,, decimals,,token2WanRatio,,, defaultPrecise) = htlcStorageData.tokenManager.getTokenInfo(tokenOrigAccount);
        (, txFeeRatio,,,,) = htlcStorageData.quotaData.getQuota(tokenOrigAccount, storemanGroupPK);

        uint temp = value.mul(1 ether);
        return temp.mul(token2WanRatio).mul(txFeeRatio).div(defaultPrecise).div(defaultPrecise).div(10**uint(decimals));
    }

}
