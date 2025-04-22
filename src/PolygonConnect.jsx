// require('dotenv').config()
import { useState, useEffect } from "react";
import { useForm } from 'react-hook-form';
import giniAbi from "./contracts/giniContract.json";
import stakingFactoryAbi from "./contracts/stakingFactoryContract.json";
import stakingContractAbi from "./contracts/stakingContract.json";

import { ethers } from "ethers";
import "./App.css"

function PolygonConnect() {
    const {
        register,
        handleSubmit,
        getValues,
        setValue,
        watch,
    } = useForm();

    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [account, setAccount] = useState(null);
    const [balance, setBalance] = useState(null);
    const [stakingFactoryContract, setStakingFactoryContract] = useState(null);
    const [stakingTokenContract, setStakingTokenContract] = useState(null);
    const [stakingContractInstance, setStakingContractInstance] = useState("");
    const [error, setError] = useState(null);


    //Staking Contract
    const [accountBalance, setAccountBalance] = useState("");
    const [calculatedReward, setCalculatedReward] = useState("");
    const [getRewards2, setGetRewards] = useState("");
    const [remainngReward, setRemainingReward] = useState("");
    const [rewardPool, setRewardPool] = useState("");
    const [stakingEndTime, setStakingEndTime] = useState("");
    const [stakingStartTime, setStakingStartTime] = useState("");
    const [stakingToken, setStakingToken] = useState("");
    const [totalStakedToken, setTotalStakedToken] = useState("");
    const [stakers, setStakers] = useState({
        stakedTokens: "",
        stakeTimestamp: "",
        withdrawalTimestamp: ""
    });
    const [poolInfo, setPoolInfo] = useState({
        stakingContract: "",
        stakingToken: "",
        startTime: "",
        endTime: "",
        admin: ""
    })

    const GINI_CONTRACT_ADDRESS = import.meta.env.VITE_GINI_ADDRESS;

    // stagenet - polygon amoy
    const STAKING_FACTORY_CONTRACT_ADDRESS = import.meta.env.VITE_STAKING_FACTORY_CONTRACT_ADDRESS;
    const CHAIN_ID = "0x13882";
    const RPC_URL = "https://polygon-amoy.g.alchemy.com/v2/m8XKrD1n0ZnGfcQMEXXW5Q46qmgGmD7w";
    const CHAIN_NAME = "Amoy";
    const CURRENCY_SYMBOL = process.env.CURRENCY_SYMBOL;

    // Check if MetaMask is installed
    useEffect(() => {
        if (!window.ethereum) {
            setError("MetaMask is not installed. Please install it to use this app.");
        }
    }, []);

    // Connect to MetaMask
    const connectWallet = async () => {
        try {
            const { webProvider, webSigner, rewardTokenContract, stakingFactoryContract } = await initializeBlockchain();
            console.log("webProvider", webProvider);
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            setAccount(accounts[0]);

            const balance = await rewardTokenContract.balanceOf(webSigner.address);
            setBalance(ethers.formatEther(balance));
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    };

    // Function to configure the network in MetaMask
    const configureNetwork = async () => {
        try {
            if (!window.ethereum) {
                throw new Error("MetaMask is not installed.");
            }

            const currentChainId = await window.ethereum.request({ method: "eth_chainId" });

            if (currentChainId !== CHAIN_ID) {
                try {
                    await window.ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: CHAIN_ID }],
                    });
                } catch (switchError) {
                    // If the network is not added, add it to MetaMask
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: "wallet_addEthereumChain",
                            params: [
                                {
                                    chainId: CHAIN_ID,
                                    chainName: CHAIN_NAME,
                                    nativeCurrency: {
                                        name: CURRENCY_SYMBOL,
                                        symbol: CURRENCY_SYMBOL,
                                        decimals: 18,
                                    },
                                    rpcUrls: [RPC_URL],
                                },
                            ],
                        });
                    } else {
                        throw new Error("Failed to switch network: " + switchError.message);
                    }
                }
            }
        } catch (err) {
            setError(err.message);
        }
    };


    // Function to initialize provider, signer, and contract
    const initializeBlockchain = async () => {
        try {
            if (!window.ethereum) {
                throw new Error("MetaMask is not installed.");
            }

            await configureNetwork(); // Ensure network is set before proceeding

            const webProvider = new ethers.BrowserProvider(window.ethereum);
            const webSigner = await webProvider.getSigner();
            const rewardTokenContract = new ethers.Contract(GINI_CONTRACT_ADDRESS, giniAbi, webSigner);
            // const webContract2 = new ethers.Contract(GINI_ADDRESS, GINI_ABI, webSigner);
            const stakingFactoryContract = new ethers.Contract(STAKING_FACTORY_CONTRACT_ADDRESS, stakingFactoryAbi, webSigner);
            setProvider(webProvider);
            setSigner(webSigner);
            setStakingTokenContract(rewardTokenContract);
            setStakingFactoryContract(stakingFactoryContract);
            return { webProvider, webSigner, rewardTokenContract, stakingFactoryContract };
        } catch (err) {
            setError(err.message);
        }
    };

    //Gini Actions
    // Approve process via GiniToken
    const handleApprove = async (approveAmount, operator) => {

        try {
            console.log("Approve Amount:", approveAmount, operator);
            if (!approveAmount || isNaN(approveAmount) || approveAmount <= 0) {
                alert("Enter a valid amount!");
                return;
            }
            const tx = await stakingTokenContract.approve(operator, ethers.parseEther(approveAmount));
            await tx.wait();
            alert(`Tokens Approved!- ${approveAmount} GINI`);
        } catch (error) {
            console.log(error);
        }
    };

    // Fetch Gini Balance
    const handleBalanceOf = async (balanceOfAddress) => {
        try {
            if (!balanceOfAddress) return;
            const balance = await stakingTokenContract.balanceOf(balanceOfAddress);
            setAccountBalance(ethers.formatEther(balance));
        } catch (error) {
            console.log(error);
        }
    };

    //Admin Factory Contract
    const createStakingContract = async (stakingTokenAddress, startTime, endTime, adminAddress) => {

        try {
            console.log("Staking Contract Values:", stakingTokenAddress, startTime, endTime, adminAddress);
            const tx = await stakingFactoryContract.createStakingPool(
                stakingTokenAddress,
                startTime,
                endTime,
                adminAddress
            );
            await tx.wait();
            alert("Staking Contract Created Successfully");
        } catch (error) {
            console.log(error);
        }
    }

    const getStakingPoolInfo = async (stakingIndex) => {
        try {
            console.log("Staking Index:", stakingIndex);
            const stakingInfoRes = await stakingFactoryContract.stakingPools(stakingIndex);
            console.log(stakingInfoRes);
            setPoolInfo({
                stakingTokenAddress: stakingInfoRes[0],
                startTime: stakingInfoRes[2],
                endTime: stakingInfoRes[3],
                adminAddress: stakingInfoRes[4]
            });
        } catch (error) {
            console.log(error);
        }
    }


    // Staking Actions
    const connectStakingContract = (stakingContract) => {
        try {
            console.log("Staking Contract Address:", stakingContract);
            localStorage.setItem('stakingContract', stakingContract);
            const stakingContractInstance = new ethers.Contract(stakingContract, stakingContractAbi, signer);
            setStakingContractInstance(stakingContractInstance);
            alert("Loaded!")
        } catch (error) {
            alert('Error connecting to staking contract: ' + error.message);
        }
    };

    // 1. stake function , button and form
    const stakeTokens = async (stakeAmount) => {
        try {
            const tx = await stakingContractInstance.stake(ethers.parseEther(stakeAmount));
            await tx.wait();
            alert("Staked successfully");
        } catch (error) {
            console.log(error)

        }
    }

    // 2. Deposit Reward , button 
    const depositReward = async (depositAmount) => {
        try {
            console.log("Deposit Amount:", depositAmount);
            const tx = await stakingContractInstance.depositReward(ethers.parseEther(depositAmount));
            await tx.wait();
            alert("Deposit successfully");
        } catch (error) {
            console.log(error)
        }
    };

    // earlyWithdraw , button 
    const earlyWithdraw = async (earlyWithdrawIndex) => {
        try {
            const tx = await stakingContractInstance.earlyWithdraw(earlyWithdrawIndex);
            await tx.wait();
            alert("earlyWithdraw successfully");
        } catch (error) {
            console.log(error)
        }
    };

    const withdrawWithReward = async (withdrawWithRewardIndex) => {
        try {
            const tx = await stakingContractInstance.withdrawWithReward(withdrawWithRewardIndex);
            await tx.wait();
            alert("withdrawWithReward successfully");
        } catch (error) {
            console.log(error)
        }
    }

    const withdrawRemainingTokens = async (recipientAddress) => {
        try {
            const tx = await stakingContractInstance.withdrawRemainingTokens(recipientAddress);
            await tx.wait();
            alert("withdrawRemainingTokens successfully");
        } catch (error) {
            console.log(error)
        }
    }

    const calculateReward = async (calculateAmount, calculateTimeStamp) => {
        try {
            const reward = await stakingContractInstance._calculateReward(calculateAmount, calculateTimeStamp);
            setCalculatedReward(ethers.formatEther(reward));
        } catch (error) {
            console.log(error);
        }
    }

    const getRewards = async (getRewardIndex) => {
        try {
            const reward = await stakingContractInstance.getRewards(getRewardIndex);
            setGetRewards(ethers.formatEther(reward));
        } catch (error) {
            console.log(error);
        }
    }

    const getStakers = async (stakerAddress, stakerAddressIndex) => {
        try {
            const stakers = await stakingContractInstance.stakers(stakerAddress, stakerAddressIndex);
            setStakers(stakers);
        } catch (error) {
            console.log(error);
        }
    }

    const loadValues = async () => {
        getRemainingRewards();
        getRewardPool();
        getstakingEndTime();
        getStakingStartTime();
        getStakingToken();
        getTotalStakedToken();
    }

    const getRemainingRewards = async () => {
        try {
            const remainingRewardsRes = await stakingContractInstance.remainingRewards();
            setRemainingReward(remainingRewardsRes);
        } catch (error) {
            console.log(error);
        }
    };

    const getRewardPool = async () => {
        try {
            const res = await stakingContractInstance.rewardPool();
            setRewardPool(res);
        } catch (error) {
            console.log(error);
        }
    };

    const getstakingEndTime = async () => {
        try {
            const res = await stakingContractInstance.stakingEndTime();
            setStakingEndTime(res);
        } catch (error) {
            console.log(error);
        }
    };

    const getStakingStartTime = async () => {
        try {
            const res = await stakingContractInstance.stakingStartTime();
            console.log(res)
            setStakingStartTime(res);
        } catch (error) {
            console.log(error);
        }
    };


    const getStakingToken = async () => {
        try {
            const res = await stakingContractInstance.stakingToken();
            console.log(res)
            setStakingToken(res);
        } catch (error) {
            console.log(error);
        }
    };

    const getTotalStakedToken = async () => {
        try {
            const res = await stakingContractInstance.totalStakedTokens();
            console.log(res)
            setTotalStakedToken(res);
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div className="card">
            {account ? (
                <>
                    <div className="stake-section">
                        <h3>GINI TOKEN ADDRESS {GINI_CONTRACT_ADDRESS}</h3>
                        <h3>STAKING FACTORY CONTRACT ADDRESS {STAKING_FACTORY_CONTRACT_ADDRESS}</h3>
                        <h3>CONNECTED {account}</h3>
                        <h3>Gini Balance {balance} Gini</h3>

                        <hr />
                        <h2>Gini Actions</h2>
                        <h3>Approve GINI Tokens</h3>
                        <div className="input-group">
                            <input type="number" placeholder="Enter amount" {...register('approveAmount')} className="input" />
                            <input type="text" placeholder="Operator" {...register('operator')} className="input" />
                            <button onClick={() => handleApprove(getValues('approveAmount'), getValues('operator'))} className="btn btn-orange">Approve Tokens</button>
                        </div>

                        <h3>Gini Token Balance</h3>
                        <div className="input-group">
                            <input type="text" placeholder="Enter address" {...register('balanceOfAddress')} className="input" />
                            <button onClick={() => handleBalanceOf(getValues('balanceOfAddress'))} className="btn btn-orange">Balance</button>
                            <h3>Balance :{accountBalance} Gini</h3>
                        </div>


                        <hr />
                        <br />
                        <h4>Set Staking Values (By Owner)</h4>
                        <table>
                            <tbody>
                                <tr>
                                    <td><label htmlFor="stakingTokenAddress">stakingTokenAddress</label></td>
                                    <td>
                                        <input id="stakingTokenAddress" type="text" placeholder="stakingTokenAddress" {...register('stakingTokenAddress')} className="input" />
                                    </td>
                                </tr>
                                <tr>
                                    <td><label htmlFor="startTime">startTime</label></td>
                                    <td>
                                        <input id="startTime" type="number" placeholder="startTime" {...register('startTime')} className="input" />
                                    </td>
                                </tr>
                                <tr>
                                    <td><label htmlFor="endTime">endTime</label></td>
                                    <td>
                                        <input id="endTime" type="number" placeholder="endTime" {...register('endTime')} className="input" />
                                    </td>
                                </tr>
                                <tr>
                                    <td><label htmlFor="adminAddress">adminAddress</label></td>
                                    <td>
                                        <input id="adminAddress" type="text" placeholder="adminAddress" {...register('adminAddress')} className="input" />
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan="2" style={{ textAlign: "center", paddingTop: "10px" }}>
                                        <button onClick={() => createStakingContract(getValues('stakingTokenAddress'), getValues('startTime'), getValues('endTime'), getValues('adminAddress'))}>Set Values</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="input-group">
                            <input type="number" placeholder="Enter Index" {...register('stakingIndex')} className="input" />
                            <button onClick={() => getStakingPoolInfo(getValues('stakingIndex'))} className="btn btn-orange">StakingPools</button>
                            <h5>StakingPools Info :<br />stakingTokenAddress: {poolInfo.stakingTokenAddress}, startTime: {poolInfo.startTime}, endTime: {poolInfo.endTime}, adminAddress: {poolInfo.adminAddress}</h5>
                        </div>

                        <hr />
                        <h3>Stake GINI Tokens</h3>
                        <div className="input-group">
                            <input type="text" placeholder={localStorage.getItem('stakingContract')} {...register('stakingContract')} className="input" />
                            <button onClick={() => connectStakingContract(getValues('stakingContract'))} className="btn btn-orange">Connect staking contract</button>
                        </div>

                        <br /><br /><br />
                        <button onClick={loadValues} className="btn btn-orange">loadValues</button>
                        <br />
                        remainngReward : {remainngReward}<br />
                        rewardPool : {rewardPool}<br />
                        stakingEndTime : {stakingEndTime}<br />
                        stakingStartTime : {stakingStartTime}<br />
                        stakingToken: {stakingToken}<br />
                        totalStakedToken : {totalStakedToken}<br />
                        <br />

                        <b>Current saved Contract</b> : {localStorage.getItem('stakingContract')}
                        <div className="input-group">
                            <input type="number" placeholder="depositReward" {...register('depositAmount')} className="input" />
                            <button onClick={() => depositReward(getValues('depositAmount'))} className="btn btn-orange">depositReward</button>
                        </div>

                        <div className="input-group">
                            <input type="number" placeholder="Stake Amount" {...register('stakeAmount')} className="input" />
                            <button onClick={() => stakeTokens(getValues('stakeAmount'))} className="btn btn-orange">Stake</button>
                        </div>

                        <div className="input-group">
                            <input type="number" placeholder="EarlyWithdraw Index" {...register('earlyWithdrawIndex')} className="input" />
                            <button onClick={() => earlyWithdraw(getValues('earlyWithdrawIndex'))} className="btn btn-orange">EarlyWithdraw</button>
                        </div>

                        <div className="input-group">
                            <input type="number" placeholder="WithdrawWithReward Index" {...register('withdrawWithRewardIndex')} className="input" />
                            <button onClick={() => withdrawWithReward(getValues('withdrawWithRewardIndex'))} className="btn btn-orange">WithdrawWithReward</button>
                        </div>

                        <div className="input-group">
                            <input type="text" placeholder="Recipient Address" {...register('recipientAddress')} className="input" />
                            <button onClick={() => withdrawRemainingTokens(getValues('recipientAddress'))} className="btn btn-orange">withdrawRemainingTokens</button>
                        </div>

                        <div className="input-group">
                            <input type="number" placeholder="Calculate Index" {...register('calculateAmount')} className="input" />
                            <input type="number" placeholder="Timestamp" {...register('calculateTimeStamp')} className="input" />
                            <button onClick={() => calculateReward(getValues('calculateAmount'), getValues('calculateTimeStamp'))} className="btn btn-orange">calculateReward</button>
                            <h5>Calculated Reward: {calculatedReward}</h5>
                        </div>

                        <div className="input-group">
                            <input type="number" placeholder="Get Reward Index" {...register('getRewardIndex')} className="input" />
                            <button onClick={() => getRewards(getValues('getRewardIndex'))} className="btn btn-orange">getRewards</button>
                            <h5>Reward Info: {getRewards2}</h5>
                        </div>

                        <div className="input-group">
                            <input type="text" placeholder="Staker Address" {...register('stakerAddress')} className="input" />
                            <input type="number" placeholder="Staker Index" {...register('stakerAddressIndex')} className="input" />
                            <button onClick={() => getStakers(getValues('stakerAddress'), getValues('stakerAddressIndex'))} className="btn btn-orange">stakers</button>
                            <h5>Stakers:<br />stakedTokens: {stakers.stakedTokens}, stakeTimestamp: {stakers.stakeTimestamp}, withdrawalTimestamp: {stakers.withdrawalTimestamp}</h5>
                        </div>
                    </div>
                </>
            ) : (
                <button onClick={connectWallet} className="btn">Connect MetaMask</button>
            )
            }

            {error && <p className="error-message">{error}</p>}
        </div >
    );

}

export { PolygonConnect };