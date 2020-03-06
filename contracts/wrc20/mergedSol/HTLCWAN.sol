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
    function isTokenRegistered(address) public view returns(bool);
    function mapKey(address) public view returns(bytes32);
    function mapTokenInfo(bytes32) public view returns(address, address, uint, uint, uint, bool, uint, uint, uint, uint);
    function DEFAULT_PRECISE() public returns (uint);
}

interface StoremanGroupInterface {
    function mapStoremanGroup(address, address) public returns(uint, address, uint, uint, uint, address, uint);
}

interface QuotaInterface {
    function lockQuota(address, address, address, uint) external returns (bool);
    function unlockQuota(address, address, uint) external returns (bool);
    function mintToken(address, address, address, uint) external returns (bool);
    function lockToken(address, address, address, uint) external returns (bool);
    function unlockToken(address, address, uint) external returns (bool);
    function burnToken(address, address, uint) external returns (bool);
}

interface WERCProtocol {
    function transfer(address, uint) public returns (bool);
    function transferFrom(address, address, uint) public returns (bool);
    function decimals() public returns(uint8);
}

contract HTLCBase is Halt {
    using SafeMath for uint;

    /**
    *
    * ENUMS
    *
    */

    /// @notice tx info status
    /// @notice uninitialized,locked,refunded,revoked
    enum TxStatus {None, Locked, Refunded, Revoked}

    /// @notice tx direction
    enum TxDirection {Inbound, Outbound}

    /**
    *
    * STRUCTURES
    *
    */

    /// @notice HTLC(Hashed TimeLock Contract) tx info
    struct HTLCTx {
        TxDirection direction;  // HTLC transfer direction
        address  source;        // HTLC transaction source address
        address  destination;   // HTLC transaction destination address
        uint value;             // HTLC transfer value of token
        TxStatus status;        // HTLC transaction status
        uint lockedTime;        // HTLC transaction locked time
        uint beginLockedTime;   // HTLC transaction begin locked time
    }

    /**
    *
    * VARIABLES
    *
    */

    /// @notice mapping of hash(x) to HTLCTx
    mapping(address => mapping(bytes32 => HTLCTx)) public mapXHashHTLCTxs;

    /// @notice mapping of hash(x) to shadow address
    mapping(address => mapping(bytes32 => address)) public mapXHashShadow;

    /// @notice atomic tx needed locked time(in seconds)
    uint public lockedTime;
    
    /// @notice default locked time(in seconds)
    uint public constant DEF_LOCKED_TIME = uint(3600*36);
    
    /// @notice default max UTC time
    uint public constant DEF_MAX_TIME = uint(0xffffffffffffffff);

    /// @notice the fee ratio of revoking operation
    uint public revokeFeeRatio;

    /// @notice revoking fee ratio precise
    /// @notice for example: revokeFeeRatio is 3, meaning that the revoking fee ratio is 3/10000
    uint public constant RATIO_PRECISE = 10000;

    /**
    *
    * MANIPULATIONS
    *
    */
    
    /// Constructor
    function HTLCBase()
        public
    {
        lockedTime = DEF_LOCKED_TIME;
    }

    /// @notice default transfer to contract
    function () 
        public
        payable 
    {
        revert();
    }

    /// @notice destruct SC and transfer balance to owner
    function kill()
        public
        onlyOwner
        isHalted
    {
        selfdestruct(owner);
    }

    /// @notice set locked time(only owner has the right)
    /// @param  time the locked time，in seconds
    function setLockedTime(uint time)
        public
        onlyOwner
        isHalted
        returns (bool)
    {
        lockedTime = time;
        return true;
    }

    /// @notice                 get left locked time of the HTLC transaction
    /// @param  tokenOrigAddr   address of ERC20 token 
    /// @param  xHash           hash of HTLC random number
    /// @return time            return left locked time, in seconds. return uint(0xffffffffffffffff) if xHash does not exist
    function getHTLCLeftLockedTime(address tokenOrigAddr, bytes32 xHash) 
        public 
        view 
        returns(uint time) 
    {
        HTLCTx storage info = mapXHashHTLCTxs[tokenOrigAddr][xHash];
        if (info.status == TxStatus.None) {
            return DEF_MAX_TIME;
        }

        if (now >=  info.beginLockedTime.add(info.lockedTime)) return 0;
        return  info.beginLockedTime.add(info.lockedTime).sub(now);
    }
    
    /// @notice     set revoke fee ratio
    function setRevokeFeeRatio(uint ratio)
        public
        onlyOwner 
        returns (bool)
    {
        require(ratio <= RATIO_PRECISE);
        revokeFeeRatio = ratio;
        return true;
    }

    /// @notice                 check HTLC transaction exist or not
    /// @param  tokenOrigAddr   address of ERC20 token 
    /// @param  xHash           hash of HTLC random number
    /// @return exist           return true if exist
    function xHashExist(address tokenOrigAddr, bytes32 xHash) 
        public 
        view 
        returns(bool exist) 
    {
        return mapXHashHTLCTxs[tokenOrigAddr][xHash].status != TxStatus.None;
    }
    
    /// @notice                 add HTLC transaction info
    /// @param  tokenOrigAddr   address of ERC20 token 
    /// @param  direction       HTLC transaction direction
    /// @param  src             HTLC transaction source address
    /// @param  des             HTLC transaction destination address
    /// @param  xHash           hash of HTLC random number
    /// @param  value           HTLC transfer value of token
    /// @param  isFirstHand     is HTLC first hand trade?
    /// @param  shadow          shadow address. used for receipt coins on opposite block chain
    function addHTLCTx(address tokenOrigAddr, TxDirection direction, address src, address des, bytes32 xHash, uint value, bool isFirstHand, address shadow)
        internal
    {
        require(value != 0);
        require(!xHashExist(tokenOrigAddr, xHash));
        
        mapXHashHTLCTxs[tokenOrigAddr][xHash] = HTLCTx(direction, src, des, value, TxStatus.Locked, isFirstHand ? lockedTime.mul(2) : lockedTime, now);
        if (isFirstHand) mapXHashShadow[tokenOrigAddr][xHash] = shadow;
    }
    
    /// @notice                 refund coins from HTLC transaction
    /// @param  tokenOrigAddr   address of ERC20 token 
    /// @param  x               random number of HTLC
    /// @param  direction       HTLC transaction direction
    /// @return xHash           return hash of HTLC random number
    function redeemHTLCTx(address tokenOrigAddr, bytes32 x, TxDirection direction)
        internal
        returns(bytes32 xHash)
    {
        xHash = keccak256(x);
        
        HTLCTx storage info = mapXHashHTLCTxs[tokenOrigAddr][xHash];
        require(info.status == TxStatus.Locked);
        require(info.direction == direction);
        require(info.destination == msg.sender);
        require(now < info.beginLockedTime.add(info.lockedTime));
        
        info.status = TxStatus.Refunded;
        return (xHash);
    }
    
    /// @notice                 revoke HTLC transaction
    /// @param  tokenOrigAddr   address of ERC20 token 
    /// @param  xHash           hash of HTLC random number
    /// @param  direction       HTLC transaction direction
    /// @param  loose           whether give counterparty revoking right
    function revokeHTLCTx(address tokenOrigAddr, bytes32 xHash, TxDirection direction, bool loose)
        internal
    {
        HTLCTx storage info = mapXHashHTLCTxs[tokenOrigAddr][xHash];
        require(info.status == TxStatus.Locked);
        require(info.direction == direction);
        require(now >= info.beginLockedTime.add(info.lockedTime));
        if (loose) {
            require((info.source == msg.sender) || (info.destination == msg.sender));
        } else {
            require(info.source == msg.sender);
        }

        info.status = TxStatus.Revoked;
    }
    
}

contract HTLCWAN is HTLCBase {

    /**
    *
    * VARIABLES
    *
    */

    /// token manager instance address
    address public tokenManager;
    /// quota ledger instance address
    address public quotaLedger;
    /// storemanGroup admin instance address
    address public storemanGroupAdmin;

    /// @notice transaction fee
    mapping(address => mapping(bytes32 => uint)) public mapXHashFee;

    /**
    *
    * EVENTS
    *
    **/

    /// @notice                 event of exchange WERC20 token with ERC20 token request
    /// @param storemanGroup    address of storemanGroup
    /// @param wanAddr          address of wanchain, used to receive WERC20 token
    /// @param xHash            hash of HTLC random number
    /// @param value            HTLC value
    /// @param tokenOrigAddr    address of ERC20 token  
    event InboundLockLogger(address indexed storemanGroup, address indexed wanAddr, bytes32 indexed xHash, uint value, address tokenOrigAddr);
    /// @notice                 event of refund WERC20 token from exchange WERC20 token with ERC20 token HTLC transaction
    /// @param wanAddr          address of user on wanchain, used to receive WERC20 token
    /// @param storemanGroup    address of storeman, the WERC20 token minter
    /// @param xHash            hash of HTLC random number
    /// @param x                HTLC random number
    /// @param tokenOrigAddr    address of ERC20 token  
    event InboundRedeemLogger(address indexed wanAddr, address indexed storemanGroup, bytes32 indexed xHash, bytes32 x, address tokenOrigAddr);
    /// @notice                 event of revoke exchange WERC20 token with ERC20 token HTLC transaction
    /// @param storemanGroup    address of storemanGroup
    /// @param xHash            hash of HTLC random number
    /// @param tokenOrigAddr    address of ERC20 token  
    event InboundRevokeLogger(address indexed storemanGroup, bytes32 indexed xHash, address indexed tokenOrigAddr);
    /// @notice                 event of exchange ERC20 token with WERC20 token request
    /// @param wanAddr          address of user, where the WERC20 token come from
    /// @param storemanGroup    address of storemanGroup, where the ERC20 token come from
    /// @param xHash            hash of HTLC random number
    /// @param value            exchange value
    /// @param ethAddr          address of ethereum, used to receive ERC20 token
    /// @param fee              exchange fee
    /// @param tokenOrigAddr    address of ERC20 token  
    event OutboundLockLogger(address indexed wanAddr, address indexed storemanGroup, bytes32 indexed xHash, uint value, address ethAddr, uint fee, address tokenOrigAddr);
    /// @notice                 event of refund WERC20 token from exchange ERC20 token with WERC20 token HTLC transaction
    /// @param storemanGroup    address of storemanGroup, used to receive WERC20 token
    /// @param wanAddr          address of user, where the WERC20 token come from
    /// @param xHash            hash of HTLC random number
    /// @param x                HTLC random number
    /// @param tokenOrigAddr    address of ERC20 token  
    event OutboundRedeemLogger(address indexed storemanGroup, address indexed wanAddr, bytes32 indexed xHash, bytes32 x, address tokenOrigAddr);
    /// @notice                 event of revoke exchange ERC20 token with WERC20 token HTLC transaction
    /// @param wanAddr          address of user
    /// @param xHash            hash of HTLC random number
    /// @param tokenOrigAddr    address of ERC20 token  
    event OutboundRevokeLogger(address indexed wanAddr, bytes32 indexed xHash, address indexed tokenOrigAddr);

    /**
    *
    * MODIFIERS
    *
    */

    /// @dev Check relevant contract addresses must be initialized before call its method
    modifier initialized() {
        require(tokenManager != address(0));
        require(quotaLedger != address(0));
        require(storemanGroupAdmin != address(0));
        _;
    }

    /**
    *
    * MANIPULATIONS
    *
    */

    /// @notice                 request exchange WERC20 token with ERC20 token(to prevent collision, x must be a 256bit random bigint) 
    /// @param  tokenOrigAddr   address of ERC20 token  
    /// @param  xHash           hash of HTLC random number
    /// @param  wanAddr         address of user, used to receive WERC20 token
    /// @param  value           exchange value
    function inboundLock(address tokenOrigAddr, bytes32 xHash, address wanAddr, uint value) 
        public 
        initialized 
        notHalted
        returns(bool) 
    {
        require(TokenInterface(tokenManager).isTokenRegistered(tokenOrigAddr));
        
        addHTLCTx(tokenOrigAddr, TxDirection.Inbound, msg.sender, wanAddr, xHash, value, false, address(0x00));
        require(QuotaInterface(quotaLedger).lockQuota(tokenOrigAddr, msg.sender, wanAddr, value));

        emit InboundLockLogger(msg.sender, wanAddr, xHash, value, tokenOrigAddr);
        return true;
    }

    /// @notice                 refund WERC20 token from recorded HTLC transaction, should be invoked before timeout
    /// @param  tokenOrigAddr   address of ERC20 token  
    /// @param  x               HTLC random number
    function inboundRedeem(address tokenOrigAddr, bytes32 x) 
        public 
        initialized 
        notHalted
        returns(bool) 
    {
        bytes32 xHash= redeemHTLCTx(tokenOrigAddr, x, TxDirection.Inbound);
        HTLCTx storage info = mapXHashHTLCTxs[tokenOrigAddr][xHash];
        require(QuotaInterface(quotaLedger).mintToken(tokenOrigAddr, info.source, info.destination, info.value));

        emit InboundRedeemLogger(info.destination, info.source, xHash, x, tokenOrigAddr);
        return true;
    }

    /// @notice                 revoke HTLC transaction of exchange WERC20 token with ERC20 token
    /// @param tokenOrigAddr    address of ERC20 token  
    /// @param xHash            hash of HTLC random number
    function inboundRevoke(address tokenOrigAddr, bytes32 xHash) 
        public 
        initialized 
        notHalted
        returns(bool) 
    {
        revokeHTLCTx(tokenOrigAddr, xHash, TxDirection.Inbound, false);
        HTLCTx storage info = mapXHashHTLCTxs[tokenOrigAddr][xHash];
        require(QuotaInterface(quotaLedger).unlockQuota(tokenOrigAddr, info.source, info.value));

        emit InboundRevokeLogger(info.source, xHash, tokenOrigAddr);
        return true;
    }

    /// @notice                 request exchange ERC20 token with WERC20 token(to prevent collision, x must be a 256bit random bigint)
    /// @param tokenOrigAddr    address of ERC20 token  
    /// @param xHash            hash of HTLC random number
    /// @param storemanGroup    address of storeman group
    /// @param ethAddr          address of ethereum, used to receive ERC20 token
    /// @param value            exchange value
    function outboundLock(address tokenOrigAddr, bytes32 xHash, address storemanGroup, address ethAddr, uint value) 
        public 
        initialized
        notHalted
        payable
        returns(bool) 
    {
        require(tx.origin == msg.sender);
        require(TokenInterface(tokenManager).isTokenRegistered(tokenOrigAddr));

        // check withdraw fee
        uint fee = getOutboundFee(tokenOrigAddr, storemanGroup, value);
        require(msg.value>= fee);

        addHTLCTx(tokenOrigAddr, TxDirection.Outbound, msg.sender, storemanGroup, xHash, value, true, ethAddr);

        require(QuotaInterface(quotaLedger).lockToken(tokenOrigAddr, storemanGroup, msg.sender, value));

        address instance;
        (,instance,,,,,,,,) = TokenInterface(tokenManager).mapTokenInfo(TokenInterface(tokenManager).mapKey(tokenOrigAddr));
        require(WERCProtocol(instance).transferFrom(msg.sender, this, value));

        mapXHashFee[tokenOrigAddr][xHash] = fee; // in wan coin
        
        // restore the extra cost
        uint left = (msg.value).sub(fee);
        if (left != 0) {
            (msg.sender).transfer(left);
        }

        emit OutboundLockLogger(msg.sender, storemanGroup, xHash, value, ethAddr, fee, tokenOrigAddr);
        
        return true;
    }

    /// @notice                 refund WERC20 token from the HTLC transaction of exchange ERC20 token with WERC20 token(must be called before HTLC timeout)
    /// @param tokenOrigAddr    address of ERC20 token  
    /// @param x                HTLC random number
    function outboundRedeem(address tokenOrigAddr, bytes32 x) 
        public 
        initialized 
        notHalted
        returns(bool) 
    {
        bytes32 xHash = redeemHTLCTx(tokenOrigAddr, x, TxDirection.Outbound);
        HTLCTx storage info = mapXHashHTLCTxs[tokenOrigAddr][xHash];

        require(QuotaInterface(quotaLedger).burnToken(tokenOrigAddr, info.destination, info.value));

        // transfer to storemanGroup
        info.destination.transfer(mapXHashFee[tokenOrigAddr][xHash]); 
        emit OutboundRedeemLogger(info.destination, info.source, xHash, x, tokenOrigAddr);
        return true;
    }

    /// @notice                 revoke HTLC transaction of exchange ERC20 token with WERC20 token(must be called after HTLC timeout)
    /// @param  tokenOrigAddr   address of ERC20 token  
    /// @notice                 the revoking fee will be sent to storeman
    /// @param  xHash           hash of HTLC random number
    function outboundRevoke(address tokenOrigAddr, bytes32 xHash) 
        public 
        initialized 
        notHalted
        returns(bool) 
    {
        revokeHTLCTx(tokenOrigAddr, xHash, TxDirection.Outbound, true);
        HTLCTx storage info = mapXHashHTLCTxs[tokenOrigAddr][xHash];

        require(QuotaInterface(quotaLedger).unlockToken(tokenOrigAddr, info.destination, info.value));

        bytes32 key;
        key = TokenInterface(tokenManager).mapKey(tokenOrigAddr);
        address instance;
        (,instance,,,,,,,,) = TokenInterface(tokenManager).mapTokenInfo(key);
        require(WERCProtocol(instance).transfer(info.source, info.value));

        uint revokeFee = mapXHashFee[tokenOrigAddr][xHash].mul(revokeFeeRatio).div(RATIO_PRECISE);
        uint left = mapXHashFee[tokenOrigAddr][xHash].sub(revokeFee);

        if (revokeFee > 0) {
            info.destination.transfer(revokeFee);
        }
        
        if (left > 0) {
            info.source.transfer(left);
        }
        
        emit OutboundRevokeLogger(info.source, xHash, tokenOrigAddr);
        return true;
    }
    
    /// @notice                 getting outbound tx fee
    /// @param  tokenOrigAddr   address of ERC20 token  
    /// @param  storemanGroup   address of storemanGroup
    /// @param  value           HTLC tx value
    /// @return                 needful fee
    function getOutboundFee(address tokenOrigAddr, address storemanGroup, uint value)
        private
        returns(uint)
    {
        TokenInterface ti = TokenInterface(tokenManager);
        StoremanGroupInterface smgi = StoremanGroupInterface(storemanGroupAdmin);
        var (,tokenWanAddr,token2WanRatio,,,,,,,) = ti.mapTokenInfo(TokenInterface(tokenManager).mapKey(tokenOrigAddr));
        var (,,,txFeeratio,,,) = smgi.mapStoremanGroup(tokenOrigAddr, storemanGroup);
        uint temp = value.mul(token2WanRatio).mul(txFeeratio).div(ti.DEFAULT_PRECISE()).div(ti.DEFAULT_PRECISE());
        return temp.mul(1 ether).div(10**uint(WERCProtocol(tokenWanAddr).decimals()));
    }

    /// @notice                 set quota ledger SC address(only owner have the right)
    /// @param  addr            quota ledger SC instance address
    function setQuotaLedger(address addr)
        public 
        onlyOwner 
        isHalted
        returns (bool)
    {
        require(addr != address(0));
        quotaLedger = addr;

        return true;
    }

    /// @notice                 set tokenOrigAddr manager SC instance address
    /// @param  addr            tokenOrigAddr manager SC instance address    
    function setTokenManager(address addr)
        public
        onlyOwner
        isHalted
        returns (bool)
    {
        require(addr != address(0));
        tokenManager = addr;

        return true;
    }

    /// @notice                 set storeman group admin SC address(only owner have the right)
    /// @param  addr            storeman group admin SC address
    function setStoremanGroupAdmin(address addr)
        public
        onlyOwner
        isHalted
        returns (bool)
    {
        require(addr != address(0));
        storemanGroupAdmin = addr;

        return true;
    }
}
