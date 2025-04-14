// require('dotenv').config()
import { useState, useEffect } from "react";
import abi from "./contracts/kalpBridge.json";
import giniAbi from "./contracts/giniContract.json";
import stakingContractAbi from "./contracts/stakingToken.json";

import { ethers } from "ethers";
import "./App.css"

function PolygonConnect() {
    const [account, setAccount] = useState(null);
    const [balance, setBalance] = useState(null);
    const [error, setError] = useState(null);
    const [claimableTokens, setClaimableTokens] = useState(null);
    const [statusMessage, setStatusMessage] = useState("");

    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);
    const [giniContract, setGiniContract] = useState(null);
    const [approveAmount, setApproveAmount] = useState("");
    const [bridgeAmount, setBridgeAmount] = useState("");
    const [receiver, setReceiver] = useState("");

    //stake
    const [stakingContract, setStakingContract] = useState(null);
    const [stakeAmount, setStakeAmount] = useState(0);
    const [rewardRate, setRewardRate] = useState({ numerator: 0, denominator: 0 });
    const [tokenAddress, setTokenAddress] = useState("");
    const [startTime, setStartTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const [setVals, setSetVals] = useState({
        rewardNumerator: 1,
        rewardDenominator: 1,
        start: 0,
        duration: 0,
        tokenAddr: "",
    });

    const STAKING_CONTRACT_ADDRESS = import.meta.env.VITE_STAKING_CONTRACT_ADDRESS;


    // stagenet - polygon amoy
    const GINI_ABI = giniAbi;
    const CONTRACT_ABI = abi;
    const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
    const GINI_ADDRESS = import.meta.env.VITE_GINI_ADDRESS;

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
            const { webProvider, webSigner, webContract2 } = await initializeBlockchain();
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            setAccount(accounts[0]);

            const balance = await webContract2.balanceOf(webSigner.address);
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
            const webContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, webSigner);
            const webContract2 = new ethers.Contract(GINI_ADDRESS, GINI_ABI, webSigner);
            const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, stakingContractAbi, webSigner);


            setProvider(webProvider);
            setSigner(webSigner);
            setContract(webContract);
            setGiniContract(webContract2);
            setStakingContract(stakingContract);
            return { webProvider, webSigner, webContract, webContract2, stakingContract };
        } catch (err) {
            setError(err.message);
        }
    };



    // 1. stake function , button and form
    const stakeTokens = async () => {
        try {
            const tx = await stakingContract.stake(ethers.parseEther(stakeAmount));
            await tx.wait();
            alert("Staked successfully");
        } catch (error) {
            console.log(error)

        }

    }
    // 2. claim funciton , button 
    const handleClaim = async () => {
        try {
            const tx = await stakingContract.claim();
            await tx.wait();
            alert("Claimed successfully");
        } catch (error) {
            console.log(error)
        }
    };

    // 3. getRewardRate  , button 

    const handleGetRewardRate = async () => {
        try {
            const [num, denom] = await stakingContract.getRewardRate();
            setRewardRate({ numerator: Number(num), denominator: Number(denom) });

        } catch (error) {
            console.log(error);
        }
    };
    // 4. giniTokenAddress, load 


    // 5. rewardNumerator
    // 6. rewardDenominator
    // 7. stakingStartTime , (epoc) => normal timestamp
    // 8. duration , 
    // 9. setValues , 
    const loadData = async () => {
        try {
            const token = await stakingContract.giniTokenAddress();
            const numerator = await stakingContract.rewardNumerator();
            const denominator = await stakingContract.rewardDenominator();
            const start = await stakingContract.stakingStartTime();
            const dur = await stakingContract.stakingDuration();

            setTokenAddress(token);
            setRewardRate({ numerator: Number(numerator), denominator: Number(denominator) });
            setStartTime(Number(start));
            setDuration(Number(dur));

        } catch (error) {
            console.log(error);
        }
    };
    const handleSetValues = async () => {
        try {
            const tx = await stakingContract.setValues(
                setVals.rewardNumerator,
                setVals.rewardDenominator,
                setVals.start,
                setVals.duration,
                setVals.tokenAddr
            );
            await tx.wait();
            alert("Values Set Successfully");
        } catch (error) {
            console.log(error);
        }
    };





    return (
        <div className="card">
            {account ? (
                <>
                    <div className="stake-section">
                        <h3>Stake GINI Tokens</h3>
                        <input
                            type="number"
                            placeholder="Stake Amount"
                            value={stakeAmount}
                            onChange={(e) => setStakeAmount(e.target.value)}
                        />
                        <button onClick={stakeTokens}>Stake</button>
                    </div>

                    <div className="claim-section">
                        <button onClick={handleClaim}>Claim Rewards</button>
                    </div>

                    <div className="reward-section">
                        <button onClick={handleGetRewardRate}>Get Reward Rate</button>
                        <p>Reward Rate: {rewardRate.numerator} / {rewardRate.denominator}</p>
                    </div>

                    <div className="info-section">
                        <button onClick={loadData}>Load Staking Info</button>
                        <p>Token Address: {tokenAddress}</p>
                        <p>Start Time: {new Date(startTime * 1000).toLocaleString()}</p>
                        <p>Duration: {duration} seconds</p>
                    </div>

                    <div className="set-values">
                        <h4>Set Staking Values</h4>
                        <table>
                            <tbody>
                                <tr>
                                    <td><label htmlFor="rewardNumerator">Reward Numerator</label></td>
                                    <td>
                                        <input
                                            id="rewardNumerator"
                                            type="number"
                                            placeholder="Reward Numerator"
                                            value={setVals.rewardNumerator}
                                            onChange={(e) => setSetVals({ ...setVals, rewardNumerator: e.target.value })}
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td><label htmlFor="rewardDenominator">Reward Denominator</label></td>
                                    <td>
                                        <input
                                            id="rewardDenominator"
                                            type="number"
                                            placeholder="Reward Denominator"
                                            value={setVals.rewardDenominator}
                                            onChange={(e) => setSetVals({ ...setVals, rewardDenominator: e.target.value })}
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td><label htmlFor="start">Start Timestamp</label></td>
                                    <td>
                                        <input
                                            id="start"
                                            type="number"
                                            placeholder="Start Timestamp"
                                            value={setVals.start}
                                            onChange={(e) => setSetVals({ ...setVals, start: e.target.value })}
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td><label htmlFor="duration">Duration (seconds)</label></td>
                                    <td>
                                        <input
                                            id="duration"
                                            type="number"
                                            placeholder="Duration (seconds)"
                                            value={setVals.duration}
                                            onChange={(e) => setSetVals({ ...setVals, duration: e.target.value })}
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td><label htmlFor="tokenAddr">Token Address</label></td>
                                    <td>
                                        <input
                                            id="tokenAddr"
                                            type="text"
                                            placeholder="Token Address"
                                            value={setVals.tokenAddr}
                                            onChange={(e) => setSetVals({ ...setVals, tokenAddr: e.target.value })}
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan="2" style={{ textAlign: "center", paddingTop: "10px" }}>
                                        <button onClick={handleSetValues}>Set Values</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <button onClick={connectWallet} className="btn">Connect MetaMask</button>
            )}

            {error && <p className="error-message">{error}</p>}
        </div>
    );
}

export { PolygonConnect };