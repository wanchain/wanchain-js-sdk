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
//  Code style according to: https://github.com/wanchain/wanchain-token/blob/master/style-guide.rst

pragma solidity ^0.4.24;

import "../lib/SafeMath.sol";
import "../components/Halt.sol";
import "./StoremanGroupStorage.sol";

contract StoremanGroupDelegate is StoremanGroupStorage, Halt {
    using SafeMath for uint;

    /**
     *
     * EVENTS
     *
     */

    /// @notice                           event for storeman register
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroup              storeman group PK
    /// @param wanDeposit                 deposit wancoin number
    /// @param quota                      corresponding token quota
    /// @param txFeeRatio                 storeman fee ratio
    event StoremanGroupRegistrationLogger(bytes tokenOrigAccount, bytes storemanGroup, uint wanDeposit, uint quota, uint txFeeRatio);

    /// @notice                           event for storeman register
    /// @param storemanGroup              storeman group PK
    /// @param isEnable                   is enable or disable
    event SetWhiteListLogger(bytes tokenOrigAccount, bytes storemanGroup, bool isEnable);

    /// @notice                           event for applying storeman group unregister
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroup              storeman group address
    /// @param applyTime                  the time for storeman applying unregister
    event StoremanGroupApplyUnRegistrationLogger(bytes tokenOrigAccount, bytes storemanGroup, uint applyTime);

    /// @notice                           event for storeman group withdraw deposit
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroup              storeman group PK
    /// @param actualReturn               actual amount wan coin received, for penalty extension
    /// @param deposit                    deposit in the first place
    event StoremanGroupWithdrawLogger(bytes tokenOrigAccount, bytes storemanGroup, uint actualReturn, uint deposit);

    /// @notice                           event for storeman group update deposit
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroup              storeman group PK
    /// @param wanDeposit                 deposit wancoin number
    /// @param quota                      corresponding token quota
    /// @param txFeeRatio                 storeman fee ratio
    event StoremanGroupUpdateLogger(bytes tokenOrigAccount, bytes storemanGroup, uint wanDeposit, uint quota, uint txFeeRatio);

    /**
    *
    * MANIPULATIONS
    *
    */

    /// @notice                           function for owner set token manager and htlc contract address
    /// @param tmAddr                     token manager contract address
    /// @param htlcAddr                   htlc contract address
    function setDependence(address tmAddr, address htlcAddr)
        external
        onlyOwner
    {
        require(tmAddr != address(0), "Invalid tokenManager address");
        require(htlcAddr != address(0), "Invalid htlc address");
        tokenManager = ITokenManager(tmAddr);
        htlc = IHTLC(htlcAddr);
    }

    /// @notice                           function for owner enable or disable storeman group white list feature
    /// @param isEnable                   enable(true) or disable(false)
    function enableWhiteList(bool isEnable)
        external
        onlyOwner
    {
        isWhiteListEnabled = isEnable;
    }

    /// @notice                           function for owner set storeman group in white list
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroup              storeman group PK
    /// @param isEnable                   enable(true) or disable(false)
    function setWhiteList(bytes tokenOrigAccount, bytes storemanGroup, bool isEnable)
        external
        onlyOwner
    {
        require(tokenOrigAccount.length != 0, "Invalid tokenOrigAccount");
        require(storemanGroup.length != 0, "Invalid storemanGroup");
        require(isWhiteListEnabled, "White list is disabled");
        require(whiteListMap[tokenOrigAccount][storemanGroup] != isEnable, "Duplicate set");
        if (isEnable) {
            whiteListMap[tokenOrigAccount][storemanGroup] = true;
        } else {
            delete whiteListMap[tokenOrigAccount][storemanGroup];
        }

        emit SetWhiteListLogger(tokenOrigAccount, storemanGroup, isEnable);
    }

    /// @notice                           function for storeman group register, this method should be
    ///                                   invoked by a storeman group registration delegate or wanchain foundation
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroup              storeman group PK
    /// @param txFeeRatio                 transaction fee ratio required by storeman group
    function storemanGroupRegister(bytes tokenOrigAccount, bytes storemanGroup, uint txFeeRatio)
        external
        payable
        notHalted
    {
        require(tokenOrigAccount.length != 0, "Invalid tokenOrigAccount");
        require(storemanGroup.length != 0, "Invalid storemanGroup");
        require(storemanGroupMap[tokenOrigAccount][storemanGroup].deposit == 0, "Duplicate register");

        uint8 decimals;
        uint token2WanRatio;
        uint minDeposit;
        uint defaultPrecise;
        (,,decimals,,token2WanRatio,minDeposit,,defaultPrecise) = tokenManager.getTokenInfo(tokenOrigAccount);
        require(minDeposit > 0, "Token doesn't exist");
        require(msg.value >= minDeposit, "At lease minDeposit");
        require(txFeeRatio < defaultPrecise, "Invalid txFeeRatio");
        if (isWhiteListEnabled) {
            require(whiteListMap[tokenOrigAccount][storemanGroup], "Not in white list");
            delete whiteListMap[tokenOrigAccount][storemanGroup];
        }

        uint quota = (msg.value).mul(defaultPrecise).div(token2WanRatio).mul(10**uint(decimals)).div(1 ether);
        htlc.addStoremanGroup(tokenOrigAccount, storemanGroup, quota, txFeeRatio);
        storemanGroupMap[tokenOrigAccount][storemanGroup] = StoremanGroup(msg.sender, msg.value, txFeeRatio, 0);

        emit StoremanGroupRegistrationLogger(tokenOrigAccount, storemanGroup, msg.value, quota, txFeeRatio);
    }

    /// @notice                           function for storeman group apply unregistration through the delegate
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroup              storeman group PK
    function storemanGroupUnregister(bytes tokenOrigAccount, bytes storemanGroup)
        external
        notHalted
    {
        StoremanGroup storage smg = storemanGroupMap[tokenOrigAccount][storemanGroup];
        require(msg.sender == smg.delegate, "Sender must be delegate");
        require(smg.unregisterApplyTime == 0, "Duplicate unregister");
        smg.unregisterApplyTime = now;
        htlc.deactivateStoremanGroup(tokenOrigAccount, storemanGroup);

        emit StoremanGroupApplyUnRegistrationLogger(tokenOrigAccount, storemanGroup, now);
    }

    /// @notice                           function for storeman group withdraw deposit through the delegate
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroup              storeman group PK
    function storemanGroupWithdrawDeposit(bytes tokenOrigAccount, bytes storemanGroup)
        external
        notHalted
    {
        StoremanGroup storage smg = storemanGroupMap[tokenOrigAccount][storemanGroup];
        require(msg.sender == smg.delegate, "Sender must be delegate");
        uint withdrawDelayTime;
        (,,,,,,withdrawDelayTime,) = tokenManager.getTokenInfo(tokenOrigAccount);
        require(now > smg.unregisterApplyTime.add(withdrawDelayTime), "Must wait until delay time");
        htlc.delStoremanGroup(tokenOrigAccount, storemanGroup);
        smg.delegate.transfer(smg.deposit);

        emit StoremanGroupWithdrawLogger(tokenOrigAccount, storemanGroup, smg.deposit, smg.deposit);

        delete storemanGroupMap[tokenOrigAccount][storemanGroup];
    }

    /// @notice                           function for storeman group append deposit through the delegate
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroup              storeman group PK
    function storemanGroupAppendDeposit(bytes tokenOrigAccount, bytes storemanGroup)
        external
        payable
        notHalted
    {
        require(msg.value > 0, "Value too small");
        StoremanGroup storage smg = storemanGroupMap[tokenOrigAccount][storemanGroup];
        require(msg.sender == smg.delegate, "Sender must be delegate");
        require(smg.unregisterApplyTime == 0, "Inactive");

        uint8 decimals;
        uint token2WanRatio;
        uint defaultPrecise;
        (,,decimals,,token2WanRatio,,,defaultPrecise) = tokenManager.getTokenInfo(tokenOrigAccount);
        uint deposit = smg.deposit.add(msg.value);
        uint quota = deposit.mul(defaultPrecise).div(token2WanRatio).mul(10**uint(decimals)).div(1 ether);
        htlc.updateStoremanGroup(tokenOrigAccount, storemanGroup, quota);
        // TODO: notify bonus contract
        smg.deposit = deposit;
        emit StoremanGroupUpdateLogger(tokenOrigAccount, storemanGroup, deposit, quota, smg.txFeeRatio);
    }

    /// @notice                           function for getting storeman group information
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroup              storeman group PK
    function getStoremanGroupInfo(bytes tokenOrigAccount, bytes storemanGroup)
        external
        view
        returns(address, uint, uint, uint)
    {
        StoremanGroup storage smg = storemanGroupMap[tokenOrigAccount][storemanGroup];
        return (smg.delegate, smg.deposit, smg.txFeeRatio, smg.unregisterApplyTime);
    }

    /// @notice fallback function
    function () public payable {
        revert("Not support");
    }
}