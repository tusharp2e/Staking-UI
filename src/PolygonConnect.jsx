// require('dotenv').config()
import { useState, useEffect } from "react";
// import abi from "./contracts/kalpBridge.json";
import giniAbi from "./contracts/giniContract.json";
//import rewardTokenAbi from "./contracts/rewardToken.json";
import stakingFactoryAbi from "./contracts/stakingFactoryContract.json";
import stakingContractAbi from "./contracts/stakingContract.json";

import { ethers } from "ethers";
import "./App.css"

function PolygonConnect() {


    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [stakingFactoryContract, setStakingFactoryContract] = useState(null);
    const [stakingTokenContract, setStakingTokenContract] = useState(null);
    const [approveAmount, setApproveAmount] = useState(0);

    //stake
    const [account, setAccount] = useState(null);
    const [balance, setBalance] = useState(null);
    const [error, setError] = useState(null);

    const [stakeAmount, setStakeAmount] = useState(0);
    const [rewardRate, setRewardRate] = useState({ numerator: 0, denominator: 0 });
    const [tokenAddress, setTokenAddress] = useState("");
    const [startTime, setStartTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [balanceOfAddress, setBalanceOfAddress] = useState("");
    const [accountBalance, setAccountBalance] = useState("");
    const [stakingIndex, setStakingIndex] = useState("")
    const [stakingContract, setStakingContract] = useState("");
    const [stakingContractInstance, setStakingContractInstance] = useState("");
    const [depositAmout, setDepositAmount] = useState("");
    const [operator, setOperator] = useState("");
    const [earlyWithdrawIndex, setEarlyWithdrawIndex] = useState("");
    const [withdrawWithRewardIndex, setWithdrawWithRewardIndex] = useState("");
    const [recipientAddress, setRecipientAddress] = useState("");
    const [calculateAmount, setCalculateAmount] = useState("");
    const [calculateTimeStamp, setCalculateTimeStamp] = useState("");
    const [calculatedReward, setCalculatedReward] = useState("");
    const [getRewardIndex, setGetRewardIndex] = useState("");
    const [getRewards2, setGetRewards] = useState("");
    const [stakerAddress, setStakerAddress] = useState("");
    const [stakerAddressIndex, setStakerAddressIndex] = useState("");
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

    const [handler, setHandler] = useState("");

    const [poolInfo, setPoolInfo] = useState({
        stakingContract: "",
        stakingToken: "",
        startTime: "",
        endTime: "",
        admin: ""
    })
    const [stakingContractValues, setStakingContractValues] = useState({
        stakingTokenAddress: "",
        startTime: 0,
        endTime: 0,
        adminAddress: ""
    });

    //CONSTANTS
    //const STAKING_CONTRACT_ADDRESS = import.meta.env.VITE_STAKING_CONTRACT_ADDRESS;
    const GINI_CONTRACT_ADDRESS = import.meta.env.VITE_GINI_ADDRESS;

    // stagenet - polygon amoy
    //const REWARD_TOKEN_ADDRESS = import.meta.env.VITE_REWARD_TOKEN_ADDRESS;
    const STAKING_FACTORY_CONTRACT_ADDRESS = import.meta.env.VITE_STAKING_FACTORY_CONTRACT_ADDRESS;

    const CHAIN_ID = "0x13882";
    const RPC_URL = "https://polygon-amoy.g.alchemy.com/v2/m8XKrD1n0ZnGfcQMEXXW5Q46qmgGmD7w";
    const CHAIN_NAME = "Amoy";
    const CURRENCY_SYMBOL = process.env.CURRENCY_SYMBOL;
    const Direct_Bridge_Private_Key = process.env.Direct_Bridge_Private_Key; // 0x80E246D93fd2313867e16300A85DDb34E0a33E15

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
    const handleApprove = async () => {

        try {
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
    const handleBalanceOf = async () => {
        try {
            if (!balanceOfAddress) return;
            const balance = await stakingTokenContract.balanceOf(balanceOfAddress);
            setAccountBalance(ethers.formatEther(balance));
        } catch (error) {
            console.log(error);
        }
    };

    //Admin Factory Contract
    const createStakingContract = async () => {

        try {
            console.log(stakingFactoryContract);
            console.log(stakingContractValues)
            const tx = await stakingFactoryContract.createStakingPool(
                stakingContractValues.stakingTokenAddress,
                stakingContractValues.startTime,
                stakingContractValues.endTime,
                stakingContractValues.adminAddress
            );
            await tx.wait();
            alert("Staking Contract Created Successfully");
        } catch (error) {
            console.log(error);
        }
    }

    const getStakingPoolInfo = async () => {
        try {
            console.log(stakingFactoryContract);
            console.log(stakingContractValues)
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
    const connectStakingContract = () => {
        try {
            localStorage.setItem('stakingContract', stakingContract);
            const stakingContractInstance = new ethers.Contract(stakingContract, stakingContractAbi, signer);
            setStakingContractInstance(stakingContractInstance);
            alert("Loaded!")
        } catch (error) {
            alert('Error connecting to staking contract: ' + error.message);
        }
    };

    // 1. stake function , button and form
    const stakeTokens = async () => {
        try {
            const tx = await stakingContractInstance.stake(ethers.parseEther(stakeAmount));
            await tx.wait();
            alert("Staked successfully");
        } catch (error) {
            console.log(error)

        }
    }

    // 2. Deposit Reward , button 
    const depositReward = async () => {
        try {
            const tx = await stakingContractInstance.depositReward(ethers.parseEther(depositAmout));
            await tx.wait();
            alert("Deposit successfully");
        } catch (error) {
            console.log(error)
        }
    };

    // earlyWithdraw , button 
    const earlyWithdraw = async () => {
        try {
            const tx = await stakingContractInstance.earlyWithdraw(earlyWithdrawIndex);
            await tx.wait();
            alert("earlyWithdraw successfully");
        } catch (error) {
            console.log(error)
        }
    };

    const withdrawWithReward = async () => {
        try {
            const tx = await stakingContractInstance.withdrawWithReward(withdrawWithRewardIndex);
            await tx.wait();
            alert("withdrawWithReward successfully");
        } catch (error) {
            console.log(error)
        }
    }

    const withdrawRemainingTokens = async () => {
        try {
            const tx = await stakingContractInstance.withdrawRemainingTokens(recipientAddress);
            await tx.wait();
            alert("withdrawRemainingTokens successfully");
        } catch (error) {
            console.log(error)
        }
    }

    const calculateReward = async () => {
        try {
            const reward = await stakingContractInstance._calculateReward(calculateAmount, calculateTimeStamp);
            setCalculatedReward(ethers.formatEther(reward));
        } catch (error) {
            console.log(error);
        }
    }

    const getRewards = async () => {
        try {
            const reward = await stakingContractInstance.getRewards(getRewardIndex);
            setGetRewards(ethers.formatEther(reward));
        } catch (error) {
            console.log(error);
        }
    }

    const getStakers = async () => {
        try {
            const stakers = await stakingContractInstance.stakers(stakerAddress, stakerAddressIndex);
            setStakers(stakers);
        } catch (error) {
            console.log(error);
        }
    }

    const loadValues = async () =>{
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
                        {/* Gini Actions */}
                        <hr></hr>
                        <h2>Gini Actions</h2>
                        <h3>Approve GINI Tokens</h3>
                        <div className="input-group">
                            <input type="number" placeholder="Enter amount" value={approveAmount} onChange={(e) => setApproveAmount(e.target.value)} className="input" />
                            <input type="text" placeholder="Operator" value={operator} onChange={(e) => setOperator(e.target.value)} className="input" />
                            <button onClick={handleApprove} className="btn btn-orange">Approve Tokens</button>
                        </div>
                        <h3>Gini Token Balance</h3>
                        <div className="input-group">
                            <input type="text" placeholder="Enter address" value={balanceOfAddress} onChange={(e) => setBalanceOfAddress(e.target.value)} className="input" />
                            <button onClick={handleBalanceOf} className="btn btn-orange">Balance</button>
                            <h3>Balance :{accountBalance} Gini</h3>
                        </div>
                        <hr></hr>

                        {/* Factory contract Actions */}
                        <br></br>
                        <div className="set-values">
                            <h4>Set Staking Values (By Owner)</h4>
                            <table>
                                <tbody>
                                    <tr>
                                        <td><label htmlFor="stakingTokenAddress">stakingTokenAddress</label></td>
                                        <td>                        <div className="input-group">

                                            <input
                                                id="stakingTokenAddress"
                                                type="text"
                                                placeholder="stakingTokenAddress"
                                                value={stakingContractValues.stakingTokenAddress}
                                                onChange={(e) => setStakingContractValues({ ...stakingContractValues, stakingTokenAddress: e.target.value })}
                                                className="input"
                                            />
                                        </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><label htmlFor="startTime">startTime</label></td>
                                        <td>
                                            <div className="input-group">
                                                <input
                                                    id="startTime"
                                                    type="number"
                                                    placeholder="startTime"
                                                    value={stakingContractValues.startTime}
                                                    onChange={(e) => setStakingContractValues({ ...stakingContractValues, startTime: e.target.value })}
                                                    className="input"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><label htmlFor="start">endTime</label></td>
                                        <td>
                                            <div className="input-group">
                                                <input
                                                    id="start"
                                                    type="number"
                                                    placeholder="endTime "
                                                    value={stakingContractValues.endTime}
                                                    onChange={(e) => setStakingContractValues({ ...stakingContractValues, endTime: e.target.value })}
                                                    className="input"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><label htmlFor="duration">adminAddress</label></td>
                                        <td> <div className="input-group">
                                            <input
                                                id="duration"
                                                type="text"
                                                placeholder="adminAddress"
                                                value={stakingContractValues.adminAddress}
                                                onChange={(e) => setStakingContractValues({ ...stakingContractValues, adminAddress: e.target.value })}
                                                className="input"
                                            />
                                        </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan="2" style={{ textAlign: "center", paddingTop: "10px" }}>
                                            <button onClick={createStakingContract}>Set Values</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="input-group">
                            <input type="number" placeholder="Enter Index" value={stakingIndex} onChange={(e) => setStakingIndex(e.target.value)} className="input" />
                            <button onClick={getStakingPoolInfo} className="btn btn-orange">StakingPools</button>
                            <h5>StakingPools Info :
                                <br />
                                stakingTokenAddress:  {poolInfo.stakingTokenAddress}, startTime: {poolInfo.startTime}, endTime: {poolInfo.endTime}, adminAddress: {poolInfo.adminAddress}</h5>
                        </div>
                        <hr></hr>
                        <br></br>

                        {/* Staking Contract Section, */}
                        <h3>Stake GINI Tokens</h3>

                        <div className="input-group">
                            <input
                                type="text"
                                placeholder={localStorage.getItem('stakingContract')}
                                value={stakingContract}
                                onChange={(e) => setStakingContract(e.target.value)}
                                className="input"
                            />
                            <button onClick={connectStakingContract} className="btn btn-orange" >Connect staking contract</button>
                        </div>

                        <br /><br /><br />
                        <button onClick={loadValues} className="btn btn-orange" >loadValues</button>
                        <br />
                        remainngReward : {remainngReward}
                        <br />
                        rewardPool : {rewardPool}
                        <br />
                        stakingEndTime : {stakingEndTime}
                        <br />
                        stakingStartTime : {stakingStartTime}
                        <br />
                        stakingToken: {stakingToken}
                        <br />
                        totalStakedToken : {totalStakedToken}
                        <br /> <br />

                        {/* Add condition if localstorage is empty then dont show below functions */}
                        <br />
                        <> <b>Current saved Contract </b> : {localStorage.getItem('stakingContract')}</>
                        <div className="input-group">
                            <input
                                type="number"
                                placeholder="depositReward"
                                value={depositAmout}
                                onChange={(e) => { setDepositAmount(e.target.value) }}
                                className="input"
                            />
                            <button onClick={depositReward} className="btn btn-orange" >depositReward</button>
                        </div>

                        <br /><br />
                        <div className="input-group">
                            <input
                                type="number"
                                placeholder="Stake Amount"
                                value={stakeAmount}
                                onChange={(e) => setStakeAmount(e.target.value)}
                                className="input"
                            />
                            <button onClick={stakeTokens} className="btn btn-orange" >Stake</button>
                        </div>
                        <br /><br />
                        <div className="input-group">
                            <input
                                type="number"
                                placeholder="Stake Amount"
                                value={earlyWithdrawIndex}
                                onChange={(e) => setEarlyWithdrawIndex(e.target.value)}
                                className="input"
                            />
                            <button onClick={earlyWithdraw} className="btn btn-orange" >EarlyWithdraw</button>
                        </div>
                        <br /><br />
                        <div className="input-group">
                            <input
                                type="number"
                                placeholder="Stake Amount"
                                value={withdrawWithRewardIndex}
                                onChange={(e) => setWithdrawWithRewardIndex(e.target.value)}
                                className="input"
                            />
                            <button onClick={withdrawWithReward} className="btn btn-orange" >WithdrawWithReward</button>
                        </div>
                        <br /><br />
                        <div className="input-group">
                            <input
                                type="number"
                                placeholder="Stake Amount"
                                value={recipientAddress}
                                onChange={(e) => setRecipientAddress(e.target.value)}
                                className="input"
                            />
                            <button onClick={withdrawRemainingTokens} className="btn btn-orange" >withdrawRemainingTokens</button>
                        </div>
                        <br /><br />
                        <div className="input-group">
                            <input type="number" placeholder="Enter Index" value={calculateAmount} onChange={(e) => setCalculateAmount(e.target.value)} className="input" />
                            <input type="number" placeholder="Enter Index" value={calculateTimeStamp} onChange={(e) => setCalculateTimeStamp(e.target.value)} className="input" />
                            <button onClick={calculateReward} className="btn btn-orange">calculateReward</button>
                            <h5>StakingPools Info :
                                <br />
                                calculated Reward: {calculatedReward} </h5>
                        </div>
                        <br /><br />
                        <div className="input-group">
                            <input type="number" placeholder="Enter Index" value={getRewardIndex} onChange={(e) => setGetRewardIndex(e.target.value)} className="input" />
                            <button onClick={getRewards} className="btn btn-orange">getRewards</button>
                            <h5>Reward Info :
                                <br />
                                calculated Reward: {getRewards2} </h5>
                        </div>

                        <br />
                        <div className="input-group">
                            <input type="text" placeholder="Enter Address" value={stakerAddress} onChange={(e) => setStakerAddress(e.target.value)} className="input" />
                            <input
                                type="number"
                                placeholder="Stake Address Index"
                                value={stakerAddressIndex}
                                onChange={(e) => setStakerAddressIndex(e.target.value)}
                                className="input"
                            />

                            <button onClick={getStakers} className="btn btn-orange">stakers</button>
                            <h5>Stakers :
                                <br />
                                stakedTokens: {stakers.stakedTokens}, stakeTimestamp: {stakers.stakeTimestamp}, withdrawalTimestamp: {stakers.withdrawalTimestamp} </h5>
                        </div>

                    </div>
                    <br></br>
                </>
            ) : (
                <button onClick={connectWallet} className="btn">Connect MetaMask</button>
            )}

            {error && <p className="error-message">{error}</p>}
        </div>
    );
}

export { PolygonConnect };