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

import "./lib/HTLCDebtLib.sol";
import "./lib/HTLCSmgLib.sol";
import "./lib/HTLCUserLib.sol";
import "../components/Halt.sol";
import "./HTLCStorage.sol";
import "./lib/HTLCLib.sol";

contract HTLCDelegate is HTLCStorage, Halt {
    using SafeMath for uint;

    /**
     *
     * MODIFIERS
     *
     */

    /// @dev Check the sender whether is storeman group admin sc or not
    modifier onlyStoremanGroupAdmin {
        require(msg.sender == htlcStorageData.storemanGroupAdmin, "Only storeman group admin sc can call it");
        _;
    }

    /// @dev Check relevant contract addresses must be initialized before call its method
    modifier initialized {
        require(htlcStorageData.tokenManager != ITokenManager(address(0)), "Token manager is null");
        // require(htlcStorageData.storemanGroupAdmin != address(0));
        _;
    }
    /// @dev Check whether the token has been registered or not
    modifier onlyTokenRegistered(bytes tokenOrigAccount) {
        require(htlcStorageData.tokenManager.isTokenRegistered(tokenOrigAccount), "Token is not registered");
        _;
    }

    /**
     *
     * MANIPULATIONS
     *
     */

    /// @notice                                 request exchange RC20 token with WRC20 on wanchain
    /// @param  tokenOrigAccount                account of original chain token
    /// @param  xHash                           hash of HTLC random number
    /// @param  wanAddr                         address of user, used to receive WRC20 token
    /// @param  value                           exchange value
    /// @param  storemanGroupPK                 PK of storeman
    /// @param  r                               signature
    /// @param  s                               signature
    function inSmgLock(bytes tokenOrigAccount, bytes32 xHash, address wanAddr, uint value, bytes storemanGroupPK, bytes r, bytes32 s)
        external
        initialized
        notHalted
        onlyTokenRegistered(tokenOrigAccount)
    {
        HTLCSmgLib.HTLCSmgLockParams memory params = HTLCSmgLib.HTLCSmgLockParams({
            tokenOrigAccount: tokenOrigAccount,
            xHash: xHash,
            wanAddr: wanAddr,
            value: value,
            storemanGroupPK: storemanGroupPK,
            r: r,
            s: s
        });
        HTLCSmgLib.inSmgLock(htlcStorageData, params);
    }

    /// @notice                                 request exchange WRC-20 token with RC20 on original chain
    /// @param xHash                            hash of HTLC random number
    /// @param value                            token value
    /// @param tokenOrigAccount                 account of original chain token
    /// @param userOrigAccount                  account of original chain, used to receive token
    /// @param storemanGroupPK                  PK of storeman group

    function outUserLock(bytes32 xHash, uint value, bytes tokenOrigAccount, bytes userOrigAccount, bytes storemanGroupPK)
        external
        initialized
        notHalted
        onlyTokenRegistered(tokenOrigAccount)
        payable
    {
        require(tx.origin == msg.sender, "Contract sender is not allowed");

        HTLCUserLib.HTLCUserLockParams memory params = HTLCUserLib.HTLCUserLockParams({
            tokenOrigAccount: tokenOrigAccount,
            xHash: xHash,
            value: value,
            storemanGroupPK: storemanGroupPK,
            userOrigAccount: userOrigAccount,
            tokenManager: htlcStorageData.tokenManager
        });
        HTLCUserLib.outUserLock(htlcStorageData, params);

    }

    /// @notice                                 user redeem WRC20 token on wanchain, which invokes mint token
    /// @param  x                               HTLC random number
    function inUserRedeem(bytes32 x)
        external
        initialized
        notHalted
    {
        HTLCUserLib.HTLCUserRedeemParams memory params = HTLCUserLib.HTLCUserRedeemParams({
            tokenManager: htlcStorageData.tokenManager,
            x: x
        });
        HTLCUserLib.inUserRedeem(htlcStorageData, params);
    }

    /// @notice                                 storeman redeem transaction on wanchain,which invokes burn token
    /// @param  x                               HTLC random number
    /// @param  r                               signature
    /// @param  s                               signature
    function outSmgRedeem(bytes32 x, bytes r, bytes32 s)
        external
        initialized
        notHalted
    {
        HTLCSmgLib.HTLCSmgRedeemParams memory params = HTLCSmgLib.HTLCSmgRedeemParams({
            tokenManager: htlcStorageData.tokenManager,
            r: r,
            s: s,
            x: x
        });
        HTLCSmgLib.outSmgRedeem(htlcStorageData, params);
    }

    /// @notice                                 inbound, storeman revoke HTLC transaction on wanchain
    /// @param xHash                            hash of HTLC random number
    function inSmgRevoke(bytes32 xHash)
        external
        initialized
        notHalted
    {
        HTLCSmgLib.inSmgRevoke(htlcStorageData,xHash);
    }

    /// @notice                                 outbound, user revoke HTLC transaction on wanchain
    /// @notice                                 the revoking fee will be sent to storeman
    /// @param  xHash                           hash of HTLC random number
    function outUserRevoke(bytes32 xHash)
        external
        initialized
        notHalted
    {
        HTLCUserLib.HTLCUserRevokeParams memory params = HTLCUserLib.HTLCUserRevokeParams({
            tokenManager: htlcStorageData.tokenManager,
            xHash: xHash
        });
        HTLCUserLib.outUserRevoke(htlcStorageData, params);
    }

    /// @notice                                 lock storeman debt
    /// @param  tokenOrigAccount                account of original chain token
    /// @param  xHash                           hash of HTLC random number
    /// @param  srcStoremanPK                   PK of src storeman
    /// @param  dstStoremanPK                   PK of dst storeman
    /// @param  r                               signature
    /// @param  s                               signature
    function inDebtLock(bytes tokenOrigAccount, bytes32 xHash, bytes srcStoremanPK, uint value, bytes dstStoremanPK, bytes r, bytes32 s)
        external
        initialized
        notHalted
        onlyTokenRegistered(tokenOrigAccount)
    {
        HTLCDebtLib.HTLCDebtLockParams memory params = HTLCDebtLib.HTLCDebtLockParams({
            tokenOrigAccount: tokenOrigAccount,
            xHash: xHash,
            value: value,
            srcStoremanPK: srcStoremanPK,
            dstStoremanPK: dstStoremanPK,
            r: r,
            s: s
        });
        HTLCDebtLib.inDebtLock(htlcStorageData, params);
    }

    /// @notice                             redeem debt, destination storeman group takes over the debt of source storeman group
    /// @param  x                           HTLC random number
    /// @param  r                           signature
    /// @param  s                           signature
    function inDebtRedeem(bytes32 x, bytes r, bytes32 s)
        external
        initialized
        notHalted
    {
        HTLCDebtLib.HTLCDebtRedeemParams memory params = HTLCDebtLib.HTLCDebtRedeemParams({
            r: r,
            s: s,
            x: x
        });
        HTLCDebtLib.inDebtRedeem(htlcStorageData, params);
    }

    /// @notice                             source storeman group revoke the debt on wanchain
    /// @param xHash                        hash of HTLC random number
    function inDebtRevoke(bytes32 xHash)
        external
        initialized
        notHalted
    {
        HTLCDebtLib.inDebtRevoke(htlcStorageData, xHash);
    }

    /// @notice                             add a storeman group and activate the storeman group
    /// @param tokenOrigAccount             account of original chain token
    /// @param storemanGroupPK              PK of the storeman group
    /// @param quota                        quota decides the token amount which the storeman group can exchange
    /// @param txFeeRatio                   exchange transaction fee ratio of this token and of this storeman group
    function addStoremanGroup(bytes tokenOrigAccount, bytes storemanGroupPK, uint quota, uint txFeeRatio)
        external
        onlyStoremanGroupAdmin
    {
        htlcStorageData.quotaData.addStoremanGroup(tokenOrigAccount, storemanGroupPK, quota, txFeeRatio);
    }

    /// @notice                             deactivate the storeman group
    /// @param tokenOrigAccount             account of original chain token
    /// @param storemanGroupPK              PK of the storeman group
    function deactivateStoremanGroup(bytes tokenOrigAccount, bytes storemanGroupPK)
        external
        onlyStoremanGroupAdmin
    {
        htlcStorageData.quotaData.deactivateStoremanGroup(tokenOrigAccount, storemanGroupPK);
    }

    /// @notice                             quit the storeman group
    /// @notice                             the debt of the storeman group must be pay-off
    /// @param tokenOrigAccount             account of original chain token
    /// @param storemanGroupPK              PK of the storeman group
    function delStoremanGroup(bytes tokenOrigAccount, bytes storemanGroupPK)
        external
        onlyStoremanGroupAdmin
    {
        htlcStorageData.quotaData.delStoremanGroup(tokenOrigAccount, storemanGroupPK);
    }

    /// @notice                             update the storeman group
    /// @param tokenOrigAccount             account of original chain token
    /// @param storemanGroupPK              PK of the storeman group
    /// @param quota                        new quota will overwrite the old one
    function updateStoremanGroup(bytes tokenOrigAccount, bytes storemanGroupPK, uint quota)
        external
        onlyStoremanGroupAdmin
    {
        htlcStorageData.quotaData.updateStoremanGroup(tokenOrigAccount, storemanGroupPK, quota);
    }

    /// @notice                             storeman group withdraw the fee to receiver account
    /// @param storemanGroupPK              PK of the storeman group
    /// @param receiver                     account of the receiver
    /// @param r                            signature
    /// @param s                            signature
    function smgWithdrawFee(bytes storemanGroupPK, uint timeStamp, address receiver, bytes r, bytes32 s) external {

        require(now < timeStamp.add(HTLCTypes.getSMGRcvTimeOut()), "The receiver address expired");
        HTLCSmgLib.smgWithdrawFee(htlcStorageData, storemanGroupPK, timeStamp, receiver, r, s);
    }

    /// @notice                             update the initialized state value of this contract
    /// @param tokenManagerAddr             address of the token manager
    /// @param storemanGroupAdminAddr       address of the storeman group
    /// @param ratio                        revoke ratio, the denominator is DEFAULT_PRECISE
    function setEconomics(address tokenManagerAddr, address storemanGroupAdminAddr, uint ratio)
        external
        onlyOwner
    {
        require(tokenManagerAddr != address(0) && storemanGroupAdminAddr != address(0), "Parameter is invalid");
        require(ratio <= HTLCTypes.getRatioPrecise(), "Ratio is invalid");

        htlcStorageData.revokeFeeRatio = ratio;
        htlcStorageData.tokenManager = ITokenManager(tokenManagerAddr);
        htlcStorageData.storemanGroupAdmin = storemanGroupAdminAddr;
    }

    /// @notice                             get the initialized state value of this contract
    /// @return tokenManagerAddr             address of the token manager
    /// @return storemanGroupAdminAddr       address of the storeman group
    /// @return revokeFeeRatio               revoke ratio, the denominator is DEFAULT_PRECISE
    function getEconomics() external view returns(address, address, uint, uint) {
        return (address(htlcStorageData.tokenManager), htlcStorageData.storemanGroupAdmin, htlcStorageData.revokeFeeRatio, HTLCLib.getLockedTime());
    }

    /// @notice                             get the detailed quota info. of this storeman group
    /// @param tokenOrigAccount             account of original chain token
    /// @param storemanGroupPK              PK of storemanGroup
    /// @return _quota                     storemanGroup's total quota
    /// @return inboundQuota               inbound, the amount which storeman group can handle
    /// @return outboundQuota              outbound, the amount which storeman group can handle
    /// @return _receivable                amount of original token to be received, equals to amount of WAN token to be minted
    /// @return _payable                   amount of WAN token to be burnt
    /// @return _debt                      amount of original token has been exchanged to the wanchain
    function queryStoremanGroupQuota(bytes tokenOrigAccount, bytes storemanGroupPK)
        external
        view
        returns(uint, uint, uint, uint, uint, uint)
    {
        return htlcStorageData.quotaData.queryQuotaInfo(tokenOrigAccount, storemanGroupPK);
    }

    /// @notice                             get the fee of the storeman group should get
    /// @param storemanGroupPK              PK of storemanGroup
    /// @return fee                                WAN coin the storeman group should get
    function getStoremanFee(bytes storemanGroupPK)
        external
        view
        returns(uint)
    {
        return htlcStorageData.mapStoremanFee[storemanGroupPK];
    }
}
