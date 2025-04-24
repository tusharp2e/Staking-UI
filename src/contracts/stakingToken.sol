// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract StakingToken is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    using SafeERC20 for ERC20;

    ERC20 public stakingToken;
    uint256 public stakingStartTime;
    uint256 public stakingEndTime;
    uint256 public rewardPool;
    uint256 public totalStakedTokens;
    uint256 public remainingRewards;
    uint256 public capNumerator;
    uint256 public capDenominator;
    // maintain a count for it
    address[] public stakersArray;

    /// @dev Revert if zero address is passed.
    error ZeroAddress();

    /// @dev Revert when rescuing GINI tokens.
    error NotAllowedToken(address token);
    error WithdrawingDuringStaking();

    event DepositReward(uint256 amount);
    event Stake(address staker, uint256 amount);
    event RescueTokens(address token, address recipient, uint256 amount);
    event WithdrawRemainingTokens(address gini, address recipient, uint256 amount);
    event WithdrawnWithReward(address user, uint256 index, uint256 stakeAmount, uint256 rewardAmount);

    struct Staker {
        uint256 stakedTokens;
        uint256 stakeTimestamp;
        uint256 withdrawalTimestamp;
    }

    mapping(address => Staker[]) public stakers;
    mapping(address => bool) public admins;

    modifier onlyAdmin() {
        require(admins[msg.sender], "Only Admin!");
        _;
    }

    function addAdmin(address _admin) public onlyOwner {
        admins[_admin] = true;
    }

    function removeAdmin(address _admin) public onlyOwner {
        admins[_admin] = false;
    }

    function initialize(uint256 _stakingStartTime, uint256 _stakingEndTime, address _stakingToken, uint256 _capNumerator, uint256 _capDenominator, address _admin) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        stakingStartTime = _stakingStartTime;
        stakingEndTime = _stakingEndTime;
        stakingToken = ERC20(_stakingToken);
        capNumerator = _capNumerator;
        capDenominator = _capDenominator;
        addAdmin(_admin);
    }

    function depositReward(uint256 _amount) onlyAdmin public {
        require(_amount > 0, "Amount should be more than zero!");
        require(block.timestamp <= stakingEndTime, "Rewards cant be deposited after the end of the staking period!");
        rewardPool += _amount;
        remainingRewards += _amount;
        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);
        emit DepositReward(_amount);
    }

    function stake(uint256 _amount) public {
        require(_amount > 0, "Amount should be more than zero!");
        require(block.timestamp <= stakingEndTime, "stake can't be performed after the end of the staking period!");
        if(stakers[msg.sender].length == 0){
            stakersArray.push(msg.sender);
        }
        Staker memory staker = Staker({stakedTokens: _amount, stakeTimestamp: block.timestamp, withdrawalTimestamp: 0});
        stakers[msg.sender].push(staker);
        totalStakedTokens += _amount;
        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);
        emit Stake(msg.sender,_amount);
    }

    function earlyWithdraw(uint256 index) external {
        require(stakers[msg.sender][index].withdrawalTimestamp == 0, "Stake already withdrawn");
        require(block.timestamp <= stakingEndTime, "Early withdrawal period ended!");
        uint256 amount = stakers[msg.sender][index].stakedTokens;
        stakers[msg.sender][index].withdrawalTimestamp = block.timestamp;
        totalStakedTokens -= amount;
        stakingToken.safeTransfer(msg.sender, amount);
    }

    function withdrawWithReward(uint256 index) external {
        require(stakers[msg.sender][index].withdrawalTimestamp == 0, "Stake already withdrawn");
        require(block.timestamp >= stakingEndTime, "Withdraw not allowed before staking end");
        uint256 stakeAmount = stakers[msg.sender][index].stakedTokens;
        uint256 rewardAmount = _calculateReward(stakeAmount, stakers[msg.sender][index].stakeTimestamp);
        remainingRewards -= rewardAmount;
        stakers[msg.sender][index].withdrawalTimestamp = block.timestamp;
        emit WithdrawnWithReward(msg.sender, index, stakeAmount, rewardAmount);

        stakingToken.safeTransfer(msg.sender, stakeAmount+rewardAmount);
    }

    function rescueTokens(address _token, address _recipient) external payable onlyAdmin {
        if (_recipient == address(0)) revert ZeroAddress();
        if (_token == address(stakingToken)) revert NotAllowedToken(_token);

        uint256 value;

        if (_token == address(0)) {
            value = address(this).balance;
            Address.sendValue(payable(_recipient), value);
        } else {
            value = ERC20(_token).balanceOf(address(this));
            ERC20(_token).safeTransfer(_recipient, value);
        }

        emit RescueTokens(_token, _recipient, value);
    }

    function withdrawRemainingTokens(address _recipient) external onlyAdmin {
        if (_recipient == address(0)) revert ZeroAddress();
        if (stakingStartTime < block.timestamp && block.timestamp < stakingEndTime) revert WithdrawingDuringStaking();

        uint256 value;

        value = stakingToken.balanceOf(address(this));
        stakingToken.safeTransfer(_recipient, value);

        emit WithdrawRemainingTokens(address(stakingToken), _recipient, value);
    }

    // this is returning the reward even after the earlyWithdraw!
    function getRewards(uint256 index) external view returns(uint256){
        uint256 amount = stakers[msg.sender][index].stakedTokens;
        uint256 stakeTimestamp = stakers[msg.sender][index].stakeTimestamp;
        // return _calculateReward(amount, stakeTimestamp);
        uint256 calculatedRewaredwithoutCap = _calculateReward(amount, stakeTimestamp);
        uint256 maxReward = (amount * capNumerator)/capDenominator ;
        if(calculatedRewaredwithoutCap > maxReward) {
            return maxReward;
        } else {
            return calculatedRewaredwithoutCap;
        }
    }
    
    // Get Functions 
    function getNumberOfStakers() view external returns(uint256){
        return stakersArray.length;
    }

    function getNumberOfStakingPerUser(address _user) view external returns (uint256){
        return stakers[_user].length;
    }

    function hasStaked(address user) external view returns (bool) {
        return stakers[user].length > 0;
    }

    function getUserStakes(address _user) view external returns (Staker[] memory){
        return stakers[_user];
    }

    // Internal Functions 

    function _calculateReward(uint256 _amount, uint256 _stakeTimestamp) view public returns(uint256){
        uint256 rewardRateAtAmount = _getRewardRateAtAmount(_amount);
        uint256 duration;
        if(_stakeTimestamp >= stakingStartTime) {
            duration = stakingEndTime - _stakeTimestamp;
        } else {
            duration = stakingEndTime - stakingStartTime;
        }
        return rewardRateAtAmount * duration;
    }

    function _getRewardRateAtAmount(uint256 _amount) private view returns(uint256) {
        require(totalStakedTokens > 0, "No staked balance found!");
        uint256 numerator;
        uint256 denominator;
        (numerator, denominator) = _getRewardRate();
        uint256 rewardRateAtAmount = (((_amount*numerator)/totalStakedTokens)/denominator);
        return rewardRateAtAmount;
    }

    function _getRewardRate() private view returns(uint256, uint256) {
        uint256 duration = stakingEndTime - stakingStartTime;
        return (rewardPool, duration);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}