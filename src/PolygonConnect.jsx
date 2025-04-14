// require('dotenv').config()
import { useState, useEffect } from "react";
import abi from "./contracts/kalpBridge.json";
import giniAbi from "./contracts/giniContract.json";
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

            setProvider(webProvider);
            setSigner(webSigner);
            setContract(webContract);
            setGiniContract(webContract2);

            return { webProvider, webSigner, webContract, webContract2 };
        } catch (err) {
            setError(err.message);
        }
    };

    // Remove it 
    const claimTokens = async () => {
        try {
            if (!contract) {
                throw new Error("Blockchain not initialized. Connect your wallet first.");
            }
            const tokens = await contract.unlockedTokens(account);
            console.log("tokens", tokens[0]);
            setClaimableTokens(tokens[0]);
        } catch (err) {
            setError(err.message);
        }
        reloadPage();
    };

    // Remove it 
    const withdrawTokens = async () => {
        try {
            if (!contract) {
                throw new Error("Blockchain not initialized. Connect your wallet first.");
            }

            setStatusMessage("Processing transaction...");

            const tx = await contract.withdrawToken();
            await tx.wait(); // Wait for transaction confirmation
            setStatusMessage("Withdrawal successful! Check your wallet balance.");
        } catch (err) {
            setError(err.message);
            setStatusMessage("");
        }
        await updateBalance();
    };

    // Remove it 
    const approveTokens = async () => {
        if (!approveAmount || isNaN(approveAmount) || approveAmount <= 0) {
            alert("Enter a valid amount!");
            return;
        }

        try {
            console.log("#############ApproveAmount#############")
            console.log(approveAmount);
            console.log(ethers.parseEther(approveAmount));
            console.log(ethers.parseEther(approveAmount).toString())
            const tx = await giniContract.approve(CONTRACT_ADDRESS, ethers.parseEther(approveAmount));
            await tx.wait();
            alert(`Tokens Approved!- ${approveAmount} GINI`);
        } catch (error) {
            console.error("Approval Error:", error);
            alert("Approval Failed!");
        }
    };

    // Remove it 
    const bridgeTokens = async () => {
        if (!bridgeAmount || isNaN(bridgeAmount) || bridgeAmount <= 0) {
            alert("Enter a valid amount!");
            return;
        }
        if (!ethers.isAddress(receiver)) {
            alert("Enter a valid Ethereum address!");
            return;
        }

        try {
            const tx = await contract.bridgeToken(receiver, ethers.parseEther(bridgeAmount));
            await tx.wait();
            console.log(tx.hash);
            // setTxId(tx.hash);
            alert(`${bridgeAmount} GINI Tokens Bridged! `);
        } catch (error) {
            console.error("Bridging Error:", error);
            alert("Bridging Failed!");
        }
        await updateBalance();
    };

    // Remove it 
    const updateBalance = async () => {
        try {
            if (giniContract && account) {
                const newBalance = await giniContract.balanceOf(account);
                setBalance(ethers.formatEther(newBalance));
            }
        } catch (err) {
            console.error("Error updating balance:", err);
        }
    };

    // 1. stake function , button and form
    // 2. claim funciton , button 
    // 3. getRewardRate  , button 
    // 4. giniTokenAddress, load 
    // 5. rewardNumerator
    // 6. rewardDenominator
    // 7. stakingStartTime , (epoc) => normal timestamp
    // 8. duration , 
    // 9. setValues , 

    return (
        <div className="card">
            {account ? (
                <div className="wallet-info">
                    <p><strong>Connected Account:</strong> {account}</p>
                    <p><strong>Balance:</strong> {balance} GINI</p>
                    <div className="button-group">
                        <button onClick={claimTokens} className="btn">Check Claimable Tokens</button>
                        {claimableTokens !== null && <p><strong>Claimable Tokens:</strong> {claimableTokens}</p>}
                        <button onClick={withdrawTokens} className="btn btn-green">Withdraw Tokens</button>
                    </div>
                    {statusMessage && <p className="status-message">{statusMessage}</p>}
                    <div className="input-group">
                        <input type="number" placeholder="Enter amount" value={approveAmount} onChange={(e) => setApproveAmount(e.target.value)} className="input" />
                        <button onClick={approveTokens} className="btn btn-orange">Approve Tokens</button>
                    </div>
                    <div className="input-group">
                        <input type="text" placeholder="Enter Receiver address" value={receiver} onChange={(e) => setReceiver(e.target.value)} className="input" />
                        <input type="number" placeholder="Enter amount" value={bridgeAmount} onChange={(e) => setBridgeAmount(e.target.value)} className="input" />
                        <button onClick={bridgeTokens} className="btn btn-blue">Bridge Tokens</button>
                    </div>
                </div>
            ) : (
                <button onClick={connectWallet} className="btn">Connect MetaMask</button>
            )}
            {error && <p className="error-message">{error}</p>}
        </div>
    );
}

export { PolygonConnect };