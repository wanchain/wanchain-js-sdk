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

contract ERC20Protocol {
    /* This is a slight change to the ERC20 base standard.
    function totalSupply() constant returns (uint supply);
    is replaced with:
    uint public totalSupply;
    This automatically creates a getter function for the totalSupply.
    This is moved to the base contract since public getter functions are not
    currently recognised as an implementation of the matching abstract
    function by the compiler.
    */
    /// total amount of tokens
    uint public totalSupply;

    /// @param _owner The address from which the balance will be retrieved
    /// @return The balance
    function balanceOf(address _owner) public constant returns (uint balance);

    /// @notice send `_value` token to `_to` from `msg.sender`
    /// @param _to The address of the recipient
    /// @param _value The amount of token to be transferred
    /// @return Whether the transfer was successful or not
    function transfer(address _to, uint _value) public returns (bool success);

    /// @notice send `_value` token to `_to` from `_from` on the condition it is approved by `_from`
    /// @param _from The address of the sender
    /// @param _to The address of the recipient
    /// @param _value The amount of token to be transferred
    /// @return Whether the transfer was successful or not
    function transferFrom(address _from, address _to, uint _value) public returns (bool success);

    /// @notice `msg.sender` approves `_spender` to spend `_value` tokens
    /// @param _spender The address of the account able to transfer the tokens
    /// @param _value The amount of tokens to be approved for transfer
    /// @return Whether the approval was successful or not
    function approve(address _spender, uint _value) public returns (bool success);

    /// @param _owner The address of the account owning tokens
    /// @param _spender The address of the account able to transfer the tokens
    /// @return Amount of remaining tokens allowed to spent
    function allowance(address _owner, address _spender) public constant returns (uint remaining);

    event Transfer(address indexed _from, address indexed _to, uint _value);
    event Approval(address indexed _owner, address indexed _spender, uint _value);
}
contract StandardToken is ERC20Protocol {
    using SafeMath for uint;

    /**
    * @dev Fix for the ERC20 short address attack.
    */
    modifier onlyPayloadSize(uint size) {
        require(msg.data.length >= size + 4);
        _;
    }

    function transfer(address _to, uint _value) onlyPayloadSize(2 * 32) public returns (bool success) {
        //Default assumes totalSupply can't be over max (2^256 - 1).
        //If your token leaves out totalSupply and can issue more tokens as time goes on, you need to check if it doesn't wrap.
        //Replace the if with this one instead.
        //if (balances[msg.sender] >= _value && balances[_to] + _value > balances[_to]) {
        if (balances[msg.sender] >= _value) {
            balances[msg.sender] -= _value;
            balances[_to] += _value;
            emit Transfer(msg.sender, _to, _value);
            return true;
        } else { return false; }
    }

    function transferFrom(address _from, address _to, uint _value) onlyPayloadSize(3 * 32) public returns (bool success) {
        //same as above. Replace this line with the following if you want to protect against wrapping uints.
        //if (balances[_from] >= _value && allowed[_from][msg.sender] >= _value && balances[_to] + _value > balances[_to]) {
        if (balances[_from] >= _value && allowed[_from][msg.sender] >= _value) {
            balances[_to] += _value;
            balances[_from] -= _value;
            allowed[_from][msg.sender] -= _value;
            emit Transfer(_from, _to, _value);
            return true;
        } else { return false; }
    }

    function balanceOf(address _owner) public constant returns (uint balance) {
        return balances[_owner];
    }

    function approve(address _spender, uint _value) onlyPayloadSize(2 * 32) public returns (bool success) {
        //  To change the approve amount you first have to reduce the addresses`
        //  allowance to zero by calling `approve(_spender, 0)` if it is not
        //  already 0 to mitigate the race condition described here:
        //  https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
        assert((_value == 0) || (allowed[msg.sender][_spender] == 0));

        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) public constant returns (uint remaining) {
      return allowed[_owner][_spender];
    }

    mapping (address => uint) balances;
    mapping (address => mapping (address => uint)) allowed;
}

contract WanToken is StandardToken, Owned {
  /**************************************
   **
   ** VARIABLES
   **
   **************************************/

  string public name;
  string public symbol;
  uint8 public decimals;

  /// Token manager address
  address public quotaLedger;

  /****************************************************************************
   **
   ** MODIFIERS
   **
   ****************************************************************************/
  modifier onlyQuotaLedger {
      require(quotaLedger == msg.sender);
      _;
  }

  modifier onlyMeaningfulValue(uint value) {
      require(value > 0);
      _;
  }

  /****************************************************************************
   **
   ** EVENTS
   **
   ****************************************************************************/
  /// @notice Logger for token mint
  /// @dev Logger for token mint
  /// @param account Whom these token will be minted to
  /// @param value Amount of ETH/WETH to be minted
  /// @param totalSupply Total amount of WETH after token mint
  event TokenMintedLogger(
    address indexed account, 
    uint indexed value,
    uint indexed totalSupply
  );

  /// @notice Logger for token burn
  /// @dev Logger for token burn
  /// @param account Initiator address
  /// @param value Amount of WETH to be burnt
  /// @param totalSupply Total amount of WETH after token burn
  event TokenBurntLogger(
    address indexed account,
    uint indexed value, 
    uint indexed totalSupply
  );

  ///@notice Initialize the TokenManager address
  ///@dev Initialize the TokenManager address
  ///@param qlAddr The QuotaLedger instance address
  ///@param tokenName The token name to be used
  ///@param tokenSymbol The token symbol to be used
  ///@param tokenDecimal The token decimals to be used
  function WanToken(address qlAddr, string tokenName, string tokenSymbol, uint8 tokenDecimal)
    public
  {
      name = tokenName;
      symbol = tokenSymbol;
      decimals = tokenDecimal;
      quotaLedger = qlAddr;
  }

  /****************************************************************************
   **
   ** MANIPULATIONS
   **
   ****************************************************************************/

  /// @notice Create token
  /// @dev Create token
  /// @param account Address will receive token
  /// @param value Amount of token to be minted
  /// @return True if successful
  function mint(address account, uint value)
    public
    onlyQuotaLedger
    onlyMeaningfulValue(value)
    returns (bool)
  {
    require(account != address(0));

    balances[account] = balances[account].add(value);
    totalSupply = totalSupply.add(value);
    
    emit TokenMintedLogger(account, value, totalSupply);
    
    return true;
  }

  /// @notice Burn token
  /// @dev Burn token
  /// @param account Address of whose token will be burnt
  /// @param value Amount of token to be burnt
  /// @return True if successful
  function burn(address account, uint value)
    public
    onlyQuotaLedger
    onlyMeaningfulValue(value)
    returns (bool)
  {
    balances[account] = balances[account].sub(value);
    totalSupply = totalSupply.sub(value);

    emit TokenBurntLogger(account, value, totalSupply);
    
    return true;
  }

  /// @notice If WAN coin is sent to this address, send it back.
  /// @dev If WAN coin is sent to this address, send it back.
  function () 
    public
    payable 
  {
    revert();
  } 
}

contract TokenManager is Halt {
    using SafeMath for uint;

    /************************************************************
     **
     ** VARIABLES
     **
     ************************************************************/

    /// a period of block numbers in which bonus is calculated and rewarded to storeman groups
    uint public constant DEFAULT_BONUS_PERIOD_BLOCKS = 6 * 60 * 24;
    /// default bonus ratio, in percentage of deposit
    uint public constant DEFAULT_BONUS_RATIO_FOR_DEPOSIT = 20;
    /// default precision
    uint public constant DEFAULT_PRECISE = 10000;
    /// a time period after which a storeman group could confirm unregistration
    uint public constant MIN_WITHDRAW_WINDOW = 60 * 60 * 72;
    /// default minimum deposit to register a storeman group
    uint public constant MIN_DEPOSIT = 10 ether;

    /// storemanGroupAdmin instance address
    address public storemanGroupAdmin;
    /// quotaLedger instance address
    address public quotaLedger;   
    /// htlc contract instance address of orginal blockchain chain
    address public origHtlc;
    /// htlc contract instance address of wanchain
    address public wanHtlc;

    /// a map from ERC20 token addresses to keccak256 hash key
    mapping(address => bytes32) public mapKey; 
    /// a map from ERC20 token addresses to registered-token information 
    mapping(bytes32 => TokenInfo) public mapTokenInfo; 
    /// a map from ERC20 token addresses to candidate token information
    mapping(address => CandidateInfo) public mapCandidateInfo;
    /// a map from ERC20 token addresses to corresponding penalty receiver addresses 
    mapping(address => address) public mapPenaltyReceiver;

    struct TokenInfo {
        address            tokenOrigAddr;       /// ERC20 token address on Ethereum mainnet
        address            tokenWanAddr;        /// a wanchain address of supported ERC20 token
        uint               token2WanRatio;      /// 1 ERC20 token valuated in wan coins
        uint               minDeposit;          /// the minimum deposit for a valid storeman group
        uint               withdrawDelayTime;   /// the delay time for withdrawing deposit after storeman group applied unregistration
        bool               useWhiteList;        /// if the storeman group address is in white list if the storeman register is controlled
        uint               startBonusBlk;       /// the beginning blk number for system bonus
        uint               bonusTotal;          /// the total bonus provided from issuer
        uint               bonusPeriodBlks;     /// the bonus period in block numbers
        uint               bonusRatio;          /// the bonus ratio deposit*ratio/precise
    }

    struct CandidateInfo {
        bool               isApproved;          /// indicate whether this ERC20 token been approved
        bytes              name;                /// WERC20 token name on wanchain mainnet
        bytes              symbol;              /// WERC20 token symbol on wanchain mainnet
        uint8              decimals;            /// WERC20 token decimals on wanchain mainnet
        uint               token2WanRatio;      /// 1 ERC20 token valuated in wan coins
        uint               minDeposit;          /// the minimum deposit for a valid storeman group
        uint               withdrawDelayTime;   /// the delay time for withdrawing deposit after storeman group applied unregistration
    }

    /************************************************************
     **
     ** EVENTS
     **
     ************************************************************/

    /// @notice                      event for token registration
    /// @dev                         event for token registration
    /// @param tokenOrigAddr         token address of original chain
    /// @param tokenWanAddr          a wanchain address of supported ERC20 token
    /// @param ratio                 coin Exchange ratio,such as ethereum 1 eth:880 WANs,the precision is 10000,the ratio is 880,0000
    /// @param minDeposit            the default min deposit
    /// @param origHtlc              htlc contract instance address of orginal blockchain chain
    /// @param wanHtlc               htlc contract instance address of wanchain  
    /// @param withdrawDelayTime     storeman unregister delay time
    /// @param tokenHash             keccak256 hash of token's name, symbol and decimals
    event TokenAddedLogger(address indexed tokenOrigAddr, address indexed tokenWanAddr, uint indexed ratio, uint minDeposit, address origHtlc, address wanHtlc, uint withdrawDelayTime, bytes32 tokenHash);


    /// @notice                      event for update a specific token's status in tokenRegWhiteList
    /// @dev                         event for update a specific token's status in tokenRegWhiteList
    /// @param tokenOrigAddr         token address of original chain
    /// @param ratio                 coin Exchange ratio,such as ethereum 1 eth:880 WANs,the precision is 10000,the ratio is 880,0000
    /// @param minDeposit            the default minimum deposit
    /// @param name                  tokenOrigAddr name to be used in wanchain
    /// @param symbol                tokenOrigAddr symbol to beused in wanchain
    /// @param decimals              tokenOrigAddr decimals
    event CandidateAddedLogger(address indexed tokenOrigAddr, uint indexed ratio, uint indexed minDeposit, uint withdrawDelayTime, bytes name, bytes symbol, uint8 decimals);
  
    /****************************************************************************
     **
     ** MANIPULATIONS
     **
     ****************************************************************************/

    /// @notice                      check if a tokenOrigAddr has been supported
    /// @dev                         check if a tokenOrigAddr has been supported
    /// @param tokenOrigAddr         address of tokenOrigAddr to be added
    function isTokenRegistered(address tokenOrigAddr)
        public
        view
        returns (bool)
    {
        TokenInfo storage tokenInfo = mapTokenInfo[mapKey[tokenOrigAddr]];
        
        return tokenInfo.tokenWanAddr != address(0) && tokenInfo.token2WanRatio != 0;
    }

    /// @notice                      set interdependent contracts
    /// @dev                         set interdependent contracts
    /// @param quotaLedgerAddr       quotaLedger contract instance address
    /// @param origHtlcAddr          htlc address of original blockchain
    /// @param wanHtlcAddr           htlc address of wanchain
    function injectDependencies(address storemanGroupAdminAddr, address quotaLedgerAddr, address origHtlcAddr, address wanHtlcAddr)
        public
        onlyOwner
        isHalted
    {
        require(storemanGroupAdminAddr != address(0) && quotaLedgerAddr != address(0) && origHtlcAddr != address(0) && wanHtlcAddr != address(0));

        storemanGroupAdmin = storemanGroupAdminAddr;
        quotaLedger = quotaLedgerAddr;
        origHtlc = origHtlcAddr;
        wanHtlc = wanHtlcAddr;
    }

    /// @notice                      post an ERC20 token as a candidate for normal support 
    /// @dev                         post an ERC20 token as a candidate for normal support 
    /// @param tokenOrigAddr         token address of original chain
    /// @param ratio                 trading ratio to wan coins
    /// @param minDeposit            the default minimum deposit
    /// @param withdrawDelayTime     storeman unregister delay time
    /// @param name                  tokenOrigAddr name to be used in WanChain
    /// @param symbol                tokenOrigAddr symbol to beused in WanChain
    /// @param decimals              tokenOrigAddr decimals
    function addCandidate(address tokenOrigAddr, uint ratio, uint minDeposit, uint withdrawDelayTime, bytes name, bytes symbol, uint8 decimals)
        public
        onlyOwner
    {
        require(!mapCandidateInfo[tokenOrigAddr].isApproved);
        require(ratio > 0);
        require(minDeposit >= MIN_DEPOSIT);
        require(withdrawDelayTime >= MIN_WITHDRAW_WINDOW);
        require(name.length != 0);
        require(symbol.length != 0);
        require(decimals != uint(0));

        mapCandidateInfo[tokenOrigAddr] = CandidateInfo(true, name, symbol, decimals, ratio, minDeposit, withdrawDelayTime);     
            
        emit CandidateAddedLogger(tokenOrigAddr, ratio, minDeposit, withdrawDelayTime, name, symbol, decimals);
    }

    /// @notice                      remove an ERC20 token candidate
    /// @dev                         remove an ERC20 token candidate
    /// @param tokenOrigAddr         token address of original chain
    function removeCandidate(address tokenOrigAddr)
        public
        onlyOwner
    {
        CandidateInfo storage candidateInfo = mapCandidateInfo[tokenOrigAddr];

        require(candidateInfo.isApproved);

        candidateInfo.isApproved = false;
        candidateInfo.name.length = 0;
        candidateInfo.symbol.length = 0;
        candidateInfo.decimals = 0;
        candidateInfo.token2WanRatio = 0;
        candidateInfo.minDeposit = 0;
        candidateInfo.withdrawDelayTime = 0;
    }

    /// @notice                      add a supported token
    /// @dev                         add a supported token
    /// @param tokenOrigAddr         token address of original chain
    function addToken(address tokenOrigAddr)
        public
    {
        // make sure initialization done
        require(origHtlc != address(0) && wanHtlc != address(0));

        // first round validation
        CandidateInfo storage candidateInfo = mapCandidateInfo[tokenOrigAddr];
        require(candidateInfo.isApproved);
        
        // second round validation
        bytes32 key = keccak256(tokenOrigAddr, candidateInfo.name, candidateInfo.symbol, candidateInfo.decimals);
        require(mapTokenInfo[key].tokenOrigAddr == address(0) && mapTokenInfo[key].tokenWanAddr == address(0)); 

        // generate an ERC20 token mirror instance
        address tokenInst = new WanToken(quotaLedger, string(candidateInfo.name), string(candidateInfo.symbol), candidateInfo.decimals);

        // create a new record
        mapTokenInfo[key] = TokenInfo(tokenOrigAddr, tokenInst, candidateInfo.token2WanRatio, candidateInfo.minDeposit, candidateInfo.withdrawDelayTime, true, 0, 0, DEFAULT_BONUS_PERIOD_BLOCKS, DEFAULT_BONUS_RATIO_FOR_DEPOSIT);
        // update token hash key
        mapKey[tokenOrigAddr] = key;
        
        // fire event
        emit TokenAddedLogger(tokenOrigAddr, tokenInst, candidateInfo.token2WanRatio, candidateInfo.minDeposit, origHtlc, wanHtlc, candidateInfo.withdrawDelayTime, key);
    }

    /// @notice                      set prams for a supported ERC20 token
    /// @dev                         set prams for a supported ERC20 token
    /// @param tokenOrigAddr         token address of original chain
    /// @param ratio                 coin Exchange ratio,such as ethereum 1 eth:880 WANs,the precision is 10000,the ratio is 880,0000
    /// @param delayTime             storeman unregister delay time
    /// @param bonusRatio            the bonus ratio deposit*ratio/precise
    /// @param penaltyReceiver       an address who will receive penalty
    function setTokenEconomics(address tokenOrigAddr, uint ratio, uint delayTime, uint bonusRatio, address penaltyReceiver)    
        public
        onlyOwner
    {
        require(isTokenRegistered(tokenOrigAddr));
        require(ratio > 0);
        require(delayTime > 0);
        require(bonusRatio > 0 && bonusRatio <= DEFAULT_PRECISE);
        require(penaltyReceiver != address(0));

        TokenInfo storage tokenInfo = mapTokenInfo[mapKey[tokenOrigAddr]];
        tokenInfo.token2WanRatio = ratio;
        tokenInfo.withdrawDelayTime = delayTime;
        tokenInfo.bonusRatio = bonusRatio;
        mapPenaltyReceiver[tokenOrigAddr] = penaltyReceiver;
    }

    /// @notice                      function for setting smg registering mode,control by foundation or registering freely
    /// @dev                         function for setting smg registering mode,control by foundation or registering freely
    /// @param tokenOrigAddr         token address of original chain
    /// @param enableUserWhiteList   smg register mode,true controlled by foundation with white list,false register freely
    function setSmgEnableUserWhiteList(address tokenOrigAddr, bool enableUserWhiteList)
        public
        onlyOwner
    {
        require(isTokenRegistered(tokenOrigAddr));
        mapTokenInfo[mapKey[tokenOrigAddr]].useWhiteList = enableUserWhiteList;
    }

    /// @notice                      function for setting current system BonusPeriod
    /// @dev                         function for setting current system BonusPeriod
    /// @param tokenOrigAddr         token address of original chain
    /// @param isSystemBonusPeriod   smg isSystemBonusPeriod, true controlled by foundation, false register freely
    /// @param systemBonusPeriod     bonus Period in blocks
    function setSystemEnableBonus(address tokenOrigAddr, bool isSystemBonusPeriod, uint systemBonusPeriod)
        public
        onlyOwner
    {
        require(isTokenRegistered(tokenOrigAddr));
        TokenInfo storage tokenInfo = mapTokenInfo[mapKey[tokenOrigAddr]];
        tokenInfo.startBonusBlk = isSystemBonusPeriod ? block.number : 0;
        tokenInfo.bonusPeriodBlks = isSystemBonusPeriod ? (systemBonusPeriod > 0 ? systemBonusPeriod : DEFAULT_BONUS_PERIOD_BLOCKS) : DEFAULT_BONUS_PERIOD_BLOCKS;
    }
    
    /// @notice                      function updating total bonus of a specific ERC20 token     
    /// @dev                         function updating total bonus of a specific ERC20 token     
    /// @param tokenOrigAddr         token address of original chain 
    /// @param bonus                 token address of original chain 
    /// @param isAdded               plus if true, else do a minus operation
    function updateTotalBonus(address tokenOrigAddr, uint bonus, bool isAdded)
        external
        returns (bool)
    {
        require(msg.sender == storemanGroupAdmin);
        require(isTokenRegistered(tokenOrigAddr));

        TokenInfo storage tokenInfo = mapTokenInfo[mapKey[tokenOrigAddr]];
        tokenInfo.bonusTotal = isAdded ? tokenInfo.bonusTotal.add(bonus) : tokenInfo.bonusTotal.sub(bonus);

        return true;
    }
         
    /// @notice                      destruct SC and transfer balance to owner
    /// @dev                         destruct SC and transfer balance to owner
    function kill()
        public
        onlyOwner
        isHalted
    {
        selfdestruct(owner);
    }

    /// Fallback

    /// @notice                      if WAN coin is sent to this address, send it back.
    /// @dev                         if WAN coin is sent to this address, send it back.
    function () 
        public
        payable 
    {
        revert();
    }
}