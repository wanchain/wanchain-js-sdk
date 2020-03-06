/*

  Copyright 2018 Wanchain Foundation.

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

/**
 * Math operations with safety checks
 */
library SafeMath {

    /**
    * @dev Multiplies two numbers, reverts on overflow.
    */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b);

        return c;
    }

    /**
    * @dev Integer division of two numbers truncating the quotient, reverts on division by zero.
    */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0); // Solidity only automatically asserts when dividing by 0
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    /**
    * @dev Subtracts two numbers, reverts on overflow (i.e. if subtrahend is greater than minuend).
    */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a);
        uint256 c = a - b;

        return c;
    }

    /**
    * @dev Adds two numbers, reverts on overflow.
    */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a);

        return c;
    }

    /**
    * @dev Divides two numbers and returns the remainder (unsigned integer modulo),
    * reverts when dividing by zero.
    */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0);
        return a % b;
    }
}

contract Owned {

    /// @dev `owner` is the only address that can call a function with this
    /// modifier
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    address public owner;

    /// @notice The Constructor assigns the message sender to be `owner`
    function Owned() public {
        owner = msg.sender;
    }

    address public newOwner;

    /// @notice `owner` can step down and assign some other address to this role
    /// @param _newOwner The address of the new owner. 0x0 can be used to create
    ///  an unowned neutral vault, however that cannot be undone
    function changeOwner(address _newOwner) public onlyOwner {
        newOwner = _newOwner;
    }


    function acceptOwnership() public {
        if (msg.sender == newOwner) {
            owner = newOwner;
        }
    }
}

contract Halt is Owned {
    
    bool public halted = true; 
    
    modifier notHalted() {
        require(!halted);
        _;
    }

    modifier isHalted() {
        require(halted);
        _;
    }
    
    function setHalt(bool halt) 
        public 
        onlyOwner
    {
        halted = halt;
    }
}

interface TokenInterface {
    function mapKey(address) public view returns(bytes32);
    function mapTokenInfo(bytes32) public view returns(address, address, uint, uint, uint, bool, uint, uint, uint, uint);
    function mapPenaltyReceiver(address) public view returns(address);
    function updateTotalBonus(address, uint, bool) external returns(bool);
    function DEFAULT_PRECISE() public returns (uint);
}

interface QuotaInterface {
    function applyUnregistration(address, address) external returns (bool);
    function setStoremanGroupQuota(address, address, uint) external returns (bool);
    function unregisterStoremanGroup(address, address, bool) external returns (bool);
}

interface WERCProtocol {
    function decimals() public returns(uint8);
}

contract StoremanGroupAdmin is Halt{
    using SafeMath for uint;
    
    /// token manager instance address
    address public tokenManager;
    /// quotaLedger instance address
    address public quotaLedger;
            
    /// a map from addresses to storeman group information
    mapping(address=>mapping(address => StoremanGroup)) public mapStoremanGroup;     
    /// a map from addresses to storeman group white list information
    mapping(address=>mapping(address => bool)) public mapSmgWhiteList;                

    struct StoremanGroup {
        uint    deposit;                  /// the storeman group deposit in wan coins
        address originalChainAddr;        /// the account for storeman group on original chain
        uint    unregisterApplyTime;      /// the time point for storeman group applied unregistration
        uint    txFeeRatio;               /// the fee ratio required by storeman group
        uint    bonusBlockNumber;         /// the start block number for bonus calculation for storeman group
        address initiator;                /// the account for registering a storeman group which provides storeman group deposit
        uint    punishPercent;            /// punish rate of deposit, which is an integer from 0 to 100
    }

    /**
    *
    * EVENTS
    *
    */   
        
    /// @notice                           event for storeman register  
    /// @dev                              event for storeman register  
    /// @param tokenOrigAddr              token address of original chain
    /// @param smgWanAddr                 smgWanAddr address
    /// @param smgOrigAddr                storeman group  original chain address
    /// @param wanDeposit                 deposit wancoin number
    /// @param quota                      corresponding token quota
    /// @param txFeeRatio                 storeman fee ratio
    event StoremanGroupRegistrationLogger(address indexed tokenOrigAddr, address indexed smgWanAddr, address smgOrigAddr, uint wanDeposit, uint quota, uint txFeeRatio);
    
    /// @notice                           event for bonus deposit
    /// @dev                              event for bonus deposit 
    /// @param tokenOrigAddr              token address of original chain
    /// @param sender                     sender for bonus
    /// @param wancoin                    deposit wancoin number
    event StoremanGroupDepositBonusLogger(address indexed tokenOrigAddr, address indexed sender, uint indexed wancoin);
    
    /// @notice                           event for storeman register  
    /// @dev                              event for storeman register  
    /// @param smgWanAddr                 storeman address
    /// @param tokenOrigAddr              token address of original chain
    event SmgEnableWhiteListLogger(address indexed smgWanAddr, address indexed tokenOrigAddr);   
        
    /// @notice                           event for applying storeman group unregister 
    /// @param tokenOrigAddr              token address of original chain
    /// @param smgWanAddr                 storemanGroup address
    /// @param applyTime                  the time for storeman applying unregister    
    event StoremanGroupApplyUnRegistrationLogger(address indexed tokenOrigAddr, address indexed smgWanAddr, uint indexed applyTime);
    
    /// @notice                           event for storeman group withdraw deposit
    /// @param tokenOrigAddr              token address of original chain
    /// @param smgWanAddr                 storemanGroup address
    /// @param actualReturn               the time for storeman applying unregister       
    /// @param deposit                    deposit in the first place
    event StoremanGroupWithdrawLogger(address indexed tokenOrigAddr, address indexed smgWanAddr, uint indexed actualReturn, uint deposit);
    
    /// @notice                           event for storeman group claiming system bonus
    /// @param tokenOrigAddr              token address of original chain
    /// @param bonusRecipient             storemanGroup address
    /// @param bonus                      the bonus for storeman claim       
    event StoremanGroupClaimSystemBonusLogger(address indexed tokenOrigAddr, address indexed bonusRecipient, uint indexed bonus);
    
    /// @notice                           event for storeman group be punished
    /// @param tokenOrigAddr              token address of original chain
    /// @param smgWanAddr                 storeman address
    /// @param punishPercent              punish percent of deposit
    event StoremanGroupPunishedLogger(address indexed tokenOrigAddr, address indexed smgWanAddr, uint indexed punishPercent);   

    /// @notice event for transfer deposit to specified address
    /// @param smgAddress   storeman address
    /// @param tokenOrigAddr         coin name
    /// @param destAddress the destination address of deposit
    event SmgTranferDepositLogger(address indexed tokenOrigAddr, address indexed smgAddress,address destAddress,uint deposit);
    
    /**
     *
     * private methods
     *
     */

    /// @notice                           function for bonus claim
    /// @param tokenOrigAddr              token address of original chain
    /// @param storemanGroup              storeman group address
    function doClaimSystemBonus(address tokenOrigAddr, address storemanGroup)
        private
    {
        StoremanGroup storage smgInfo = mapStoremanGroup[tokenOrigAddr][storemanGroup];
        
        var (,,,,,,startBonusBlk,bonusTotal,bonusPeriodBlks,bonusRatio) = TokenInterface(tokenManager).mapTokenInfo(TokenInterface(tokenManager).mapKey(tokenOrigAddr));

        if(smgInfo.punishPercent != 0 || startBonusBlk == 0){
          return;
        }

        smgInfo.bonusBlockNumber = smgInfo.bonusBlockNumber < startBonusBlk ? startBonusBlk : smgInfo.bonusBlockNumber;
       
        if (block.number.sub(smgInfo.bonusBlockNumber) >= bonusPeriodBlks && smgInfo.deposit > 0) {
            uint cycles = (block.number.sub(smgInfo.bonusBlockNumber)).div(bonusPeriodBlks);

            smgInfo.bonusBlockNumber = smgInfo.bonusBlockNumber.add(cycles.mul(bonusPeriodBlks));

            uint bonus = smgInfo.deposit.mul(bonusRatio).div(TokenInterface(tokenManager).DEFAULT_PRECISE());
            bonus = bonus.mul(cycles);

            if (bonusTotal >= bonus && bonus > 0) {
                require(TokenInterface(tokenManager).updateTotalBonus(tokenOrigAddr, bonus, false));
                    if (smgInfo.initiator != address(0)) {
                        smgInfo.initiator.transfer(bonus);
                        emit StoremanGroupClaimSystemBonusLogger(tokenOrigAddr, smgInfo.initiator, bonus);      
                    } else {
                        msg.sender.transfer(bonus);
                        emit StoremanGroupClaimSystemBonusLogger(tokenOrigAddr, msg.sender, bonus);     
                    }
            } else {
                  emit StoremanGroupClaimSystemBonusLogger(tokenOrigAddr, msg.sender, 0);
            }
        }
    }

    /**
    *
    * MANIPULATIONS
    *
    */

    /// @notice                           set tokenManager instance address and quotaLedger instance address
    /// @param tm                         token manager instance address
    /// @param ql                         quota ledger instance address
    function injectDependencies(address tm, address ql)
        public
        onlyOwner
        isHalted
    {
        require(tm != address(0) && ql != address(0));
        tokenManager = tm;
        quotaLedger = ql;
    }

    /// @notice                           function for setting smg white list by owner
    /// @param tokenOrigAddr              token address of original chain
    /// @param storemanGroup              storemanGroup address for whitelist    
    function setSmgWhiteList(address tokenOrigAddr, address storemanGroup)
        public
        onlyOwner
    {
        require(storemanGroup!=address(0));

        // make sure white list mechanism is enabled
        var (,,,,,useWhiteList,,,,) = TokenInterface(tokenManager).mapTokenInfo(TokenInterface(tokenManager).mapKey(tokenOrigAddr));
        require(useWhiteList);        

        require(mapStoremanGroup[tokenOrigAddr][storemanGroup].bonusBlockNumber == 0);
        require(!mapSmgWhiteList[tokenOrigAddr][storemanGroup]);

        mapSmgWhiteList[tokenOrigAddr][storemanGroup] = true;
            
        emit SmgEnableWhiteListLogger(storemanGroup, tokenOrigAddr);
    }    
                
    /// @notice                           function for storeman registration, this method should be invoked by the storemanGroup himself
    /// @param tokenOrigAddr              token address of original chain
    /// @param originalChainAddr          the storeman group info on original chain
    /// @param txFeeRatio                 the transaction fee required by storeman group  
    function storemanGroupRegister(address tokenOrigAddr, address originalChainAddr, uint txFeeRatio)
        public
        payable
        notHalted
    {
        storemanGroupRegisterByDelegate(tokenOrigAddr, msg.sender, originalChainAddr, txFeeRatio);
    }

    /// @notice                           function for storeman register by sender this method should be
    ///                                   invoked by a storemanGroup registration proxy or wanchain foundation
    /// @param tokenOrigAddr              token address of original chain
    /// @param storemanGroup              the storeman group register address  
    /// @param originalChainAddr          the storeman group info on original chain
    /// @param txFeeRatio                 the transaction fee required by storeman group  
    function storemanGroupRegisterByDelegate(address tokenOrigAddr, address storemanGroup, address originalChainAddr,uint txFeeRatio)
        public
        payable
        notHalted
    {
        require(storemanGroup != address(0) && originalChainAddr != address(0) && txFeeRatio > 0);
        require(mapStoremanGroup[tokenOrigAddr][storemanGroup].deposit == uint(0));
        
        var (,tokenWanAddr,token2WanRatio,minDeposit,,useWhiteList,,,,) = TokenInterface(tokenManager).mapTokenInfo(TokenInterface(tokenManager).mapKey(tokenOrigAddr));

        require(msg.value >= minDeposit && mapStoremanGroup[tokenOrigAddr][storemanGroup].bonusBlockNumber == 0);

        // white list filter
        if (useWhiteList) {
            require(mapSmgWhiteList[tokenOrigAddr][storemanGroup]);
            mapSmgWhiteList[tokenOrigAddr][storemanGroup] = false;
        }

        uint quota = (msg.value).mul(TokenInterface(tokenManager).DEFAULT_PRECISE()).div(token2WanRatio).mul(10**uint(WERCProtocol(tokenWanAddr).decimals())).div(1 ether);

        // regsiter this storeman group with calculated quota
        require(QuotaInterface(quotaLedger).setStoremanGroupQuota(tokenOrigAddr, storemanGroup, quota));

        mapStoremanGroup[tokenOrigAddr][storemanGroup] = StoremanGroup(msg.value, originalChainAddr, 0, txFeeRatio, block.number, storemanGroup == msg.sender ? address(0) : msg.sender, 0);
           
        /// fire event
        emit StoremanGroupRegistrationLogger(tokenOrigAddr, storemanGroup, originalChainAddr, msg.value, quota,txFeeRatio);
    }  

    /// @notice                           function for storemanGroup applying unregister
    /// @dev                              function for storemanGroup applying unregister
    /// @param tokenOrigAddr              token address of original chain
    function storemanGroupApplyUnregister(address tokenOrigAddr)
        public
        notHalted
    {
        smgApplyUnregisterByDelegate(tokenOrigAddr, msg.sender);
    } 

    /// @notice                           apply unregistration through a proxy
    /// @dev                              apply unregistration through a proxy
    /// @param tokenOrigAddr              token address of original chain
    /// @param storemanGroup              storemanGroup address 
    function smgApplyUnregisterByDelegate(address tokenOrigAddr, address storemanGroup)
        public
        notHalted
    {
        if (msg.sender != storemanGroup) {
            require(mapStoremanGroup[tokenOrigAddr][storemanGroup].initiator == msg.sender);
        }

        // make sure this storemanGroup has registered
        StoremanGroup storage smg = mapStoremanGroup[tokenOrigAddr][storemanGroup];
        require(smg.bonusBlockNumber > 0);
        // make sure this storemanGroup has not applied
        require(smg.unregisterApplyTime == 0);

        smg.unregisterApplyTime = now;

        var (,,,,,,startBonusBlk,,,) = TokenInterface(tokenManager).mapTokenInfo(TokenInterface(tokenManager).mapKey(tokenOrigAddr));

        if (startBonusBlk > 0 && smg.punishPercent==0) {
            doClaimSystemBonus(tokenOrigAddr, storemanGroup);
        }

        require(QuotaInterface(quotaLedger).applyUnregistration(tokenOrigAddr, storemanGroup));

        // fire event
        emit StoremanGroupApplyUnRegistrationLogger(tokenOrigAddr, storemanGroup, now);
    }

    /// @notice                           function for storeman group withdraw deposit
    /// @dev                              function for storeman group withdraw deposit
    /// @param tokenOrigAddr              token address of original chain
    function storemanGroupWithdrawDeposit(address tokenOrigAddr)
        public
        notHalted
    {
        smgWithdrawDepositByDelegate(tokenOrigAddr, msg.sender);
    }

    /// @notice                           withdraw deposit through a proxy
    /// @dev                              withdraw deposit through a proxy
    /// @param tokenOrigAddr              token address of original chain
    /// @param storemanGroup              storemanGroup address 
    function smgWithdrawDepositByDelegate(address tokenOrigAddr, address storemanGroup)
        public
        notHalted
    {
        if (msg.sender != storemanGroup) {
            require(mapStoremanGroup[tokenOrigAddr][storemanGroup].initiator == msg.sender);     
        }
          
        StoremanGroup storage smg = mapStoremanGroup[tokenOrigAddr][storemanGroup];
        var (,,,,withdrawDelayTime,,,,,) = TokenInterface(tokenManager).mapTokenInfo(TokenInterface(tokenManager).mapKey(tokenOrigAddr));

        require(now > smg.unregisterApplyTime.add(withdrawDelayTime) && smg.deposit > 0);

        require(QuotaInterface(quotaLedger).unregisterStoremanGroup(tokenOrigAddr, storemanGroup, true));
        
        uint deposit = smg.deposit;
        uint restBalance = smg.deposit;

        if (smg.punishPercent > 0) {
            // transfer penalty to the penaltyReceiver of corresponding ERC20 token
            restBalance = restBalance.sub(restBalance.mul(smg.punishPercent).div(100));
            address penaltyReceiver = TokenInterface(tokenManager).mapPenaltyReceiver(tokenOrigAddr);
            require(penaltyReceiver != address(0));
            penaltyReceiver.transfer(deposit.sub(restBalance));
        }
        
        smg.deposit = 0;   
        smg.originalChainAddr = address(0);  
        smg.unregisterApplyTime = 0;
        smg.txFeeRatio = 0;           
        smg.bonusBlockNumber = 0;  
        smg.punishPercent = 0;
        
        if (smg.initiator != address(0)) {
            smg.initiator.transfer(restBalance);
        } else {
            msg.sender.transfer(restBalance);   
        }
        smg.initiator = address(0);

        emit StoremanGroupWithdrawLogger(tokenOrigAddr, storemanGroup, restBalance, deposit);
    }

    /// @notice                           function for storeman claiming system bonus
    /// @dev                              function for storeman claiming system bonus
    /// @param tokenOrigAddr              token address of original chain
    function storemanGroupClaimSystemBonus(address tokenOrigAddr)
        public
        notHalted
    {
        StoremanGroup storage smg = mapStoremanGroup[tokenOrigAddr][msg.sender];
        require(smg.bonusBlockNumber != 0 && smg.unregisterApplyTime == 0);
        
        doClaimSystemBonus(tokenOrigAddr, msg.sender);
    }

    /// @notice                           function for storeman claiming system bonus through a proxy  
    /// @dev                              function for storeman claiming system bonus through a proxy
    /// @param tokenOrigAddr              token address of original chain
    /// @param storemanGroup              storemanGroup address 
    function smgClaimSystemBonusByDelegate(address tokenOrigAddr, address storemanGroup)
        public
        notHalted
    {
        // make sure the address who registered this smg initiated this transaction
        require(mapStoremanGroup[tokenOrigAddr][storemanGroup].initiator == msg.sender); 
        
        StoremanGroup storage smg = mapStoremanGroup[tokenOrigAddr][storemanGroup];
        require(smg.bonusBlockNumber != 0 && smg.unregisterApplyTime == 0); 
        
        doClaimSystemBonus(tokenOrigAddr, storemanGroup);
    }

    /// @notice                           function for bonus deposit
    /// @dev                              function for bonus deposit
    /// @param tokenOrigAddr              token address of original chain
    function depositSmgBonus(address tokenOrigAddr)
        public
        payable
        onlyOwner
    {
        require(msg.value > 0);
        
        var (,,,,,,startBonusBlk,,,) = TokenInterface(tokenManager).mapTokenInfo(TokenInterface(tokenManager).mapKey(tokenOrigAddr));
        require(startBonusBlk > 0);
        
        require(TokenInterface(tokenManager).updateTotalBonus(tokenOrigAddr, msg.value, true));

        emit StoremanGroupDepositBonusLogger(tokenOrigAddr, msg.sender, msg.value);
    }
                    
    /// @notice                           function for storeman applying unregister
    /// @dev                              function for storeman applying unregister
    /// @param tokenOrigAddr              token address of original chain
    /// @param storemanGroup              storemanGroup address 
    /// @param punishPercent              punished percent of deposit bonus
    function punishStoremanGroup(address tokenOrigAddr, address storemanGroup, uint punishPercent)
        public
        onlyOwner
    {
        require(punishPercent > 0 && punishPercent<=100);
        StoremanGroup storage info = mapStoremanGroup[tokenOrigAddr][storemanGroup];
        require(info.deposit != 0);
        
        info.punishPercent = punishPercent;

        emit StoremanGroupPunishedLogger(tokenOrigAddr, storemanGroup, punishPercent);
    }    
    
    /// @notice                           function tranfer out the specified smg deposit 
    ///                                   in case of smg lost keystore which can not recovered anymore
    /// @param tokenOrigAddr              token address of original chain
    /// @param storemanGroup              storeman group address
    /// @param destAddress                coin recipient address
    /// @param isTransferAll              indicate if make a full transfer
    function transferSmgDeposit(address tokenOrigAddr, address storemanGroup, address destAddress, bool isTransferAll)
        public
        onlyOwner
    {
        if (isTransferAll && halted) {
            owner.transfer(address(this).balance);
        } else {
            require(mapStoremanGroup[tokenOrigAddr][storemanGroup].deposit > 0);
            
            uint deposit = mapStoremanGroup[tokenOrigAddr][storemanGroup].deposit;

            require(QuotaInterface(quotaLedger).unregisterStoremanGroup(tokenOrigAddr, storemanGroup, false));

            // set deposit to 0
            mapStoremanGroup[tokenOrigAddr][storemanGroup].deposit = 0;

            destAddress.transfer(deposit);
        }

        emit SmgTranferDepositLogger(tokenOrigAddr, storemanGroup, destAddress, deposit);
    }

    /// @notice function for destroy contract
    function kill() 
        public
        isHalted
        onlyOwner
    {
        selfdestruct(owner);
    } 

    /// @notice fallback function
    function () public payable {
       revert();
    }
}  

