// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "./Staking.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract StakingFactory is Ownable {
    // Struct to store metadata about each deployed staking pool
    struct StakingPoolInfo {
        address stakingContract; // Address of the deployed staking contract
        address stakingToken;   // ERC-20 token used for staking
        uint256 startTime;      // Staking start time
        uint256 endTime;        // Staking end time
        uint256 capNumerator;          // Cap nemoninator of the staking token
        uint256 capDenominator;     // Cap denominator of the staking token
        address admin;
    }

    // Array of all deployed staking pools
    StakingPoolInfo[] public stakingPools;
    
    // Address of the StakingToken implementation contract
    address public immutable stakingImplementation;

    event StakingPoolCreated(
        address indexed stakingContract,
        address indexed stakingToken,
        uint256 startTime,
        uint256 endTime,
        uint256 _capNumerator,
        uint256 _capDenominator, 
        address admin
    );

    constructor(address _stakingImplementation) Ownable(msg.sender) {
        require(_stakingImplementation != address(0), "Invalid implementation address");
        stakingImplementation = _stakingImplementation;
    }

    // Deploy a new staking contract via UUPS proxy
    function createStakingPool(
        address stakingToken,
        uint256 startTime,
        uint256 endTime,
        uint256 _capNumerator,
        uint256 _capDenominator,
        address admin
    ) external onlyOwner returns (address) {
        // Input validation
        require(stakingToken != address(0), "Invalid token address");
        require(startTime >= block.timestamp, "Start time in past");
        require(endTime > startTime, "Invalid end time");

        // Deploy proxy pointing to the StakingToken implementation
        ERC1967Proxy proxy = new ERC1967Proxy(
            stakingImplementation,
            abi.encodeWithSelector(
                StakingToken.initialize.selector,
                startTime,
                endTime,
                stakingToken,
                _capNumerator,
                _capDenominator,
                admin
            )
        );
        address stakingContract = address(proxy);

        // Store pool info
        StakingPoolInfo memory info = StakingPoolInfo({
            stakingContract: stakingContract,
            stakingToken: stakingToken,
            startTime: startTime,
            endTime: endTime,
            capNumerator: _capNumerator,
            capDenominator : _capDenominator,
            admin: admin
        });
        stakingPools.push(info);

        // Emit event
        emit StakingPoolCreated(stakingContract, stakingToken, startTime, endTime, _capNumerator, _capDenominator, admin);

        return stakingContract;
    }

    // Get number of staking pools
    function getStakingPoolCount() external view returns (uint256) {
        return stakingPools.length;
    }
}