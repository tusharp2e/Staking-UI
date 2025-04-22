import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import giniAbi from "../contracts/giniContract.json";
import stakingFactoryAbi from "../contracts/stakingFactoryContract.json";

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [stakingFactoryContract, setStakingFactoryContract] = useState(null);
  const [stakingTokenContract, setStakingTokenContract] = useState(null);
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState(null);

  const GINI_ADDRESS = import.meta.env.VITE_GINI_ADDRESS;
  const STAKING_FACTORY = import.meta.env.VITE_STAKING_FACTORY_CONTRACT_ADDRESS;
  const CHAIN_ID = "0x13882";
  const RPC_URL = "https://polygon-amoy.g.alchemy.com/v2/m8XKrD1n0ZnGfcQMEXXW5Q46qmgGmD7w";
  const CHAIN_NAME = "Amoy";
  const CURRENCY_SYMBOL = "MATIC";

  const connectWallet = async () => {
    try {
      const { webProvider, webSigner, rewardTokenContract, factoryContract } = await initializeBlockchain();
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);

      const bal = await rewardTokenContract.balanceOf(webSigner.address);
      setBalance(ethers.formatEther(bal));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const configureNetwork = async () => {
    const currentChainId = await window.ethereum.request({ method: "eth_chainId" });

    if (currentChainId !== CHAIN_ID) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: CHAIN_ID }],
        });
      } catch (err) {
        if (err.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: CHAIN_ID,
                chainName: CHAIN_NAME,
                nativeCurrency: { name: CURRENCY_SYMBOL, symbol: CURRENCY_SYMBOL, decimals: 18 },
                rpcUrls: [RPC_URL],
              },
            ],
          });
        } else {
          throw err;
        }
      }
    }
  };

  const initializeBlockchain = async () => {
    if (!window.ethereum) throw new Error("Install MetaMask");
    await configureNetwork();
    const webProvider = new ethers.BrowserProvider(window.ethereum);
    const webSigner = await webProvider.getSigner();

    const rewardTokenContract = new ethers.Contract(GINI_ADDRESS, giniAbi, webSigner);
    const factoryContract = new ethers.Contract(STAKING_FACTORY, stakingFactoryAbi, webSigner);

    setProvider(webProvider);
    setSigner(webSigner);
    setStakingFactoryContract(factoryContract);
    setStakingTokenContract(rewardTokenContract);

    return { webProvider, webSigner, rewardTokenContract, factoryContract };
  };

  useEffect(() => {
    if (!window.ethereum) {
      setError("MetaMask not installed");
    }
    const reconnectWallet = async () => {
      if (window.ethereum && window.ethereum.selectedAddress) {
        await connectWallet();
      }
    };
    reconnectWallet();
  }, []);

  return (
    <WalletContext.Provider
      value={{
        provider,
        signer,
        account,
        stakingFactoryContract,
        stakingTokenContract,
        balance,
        error,
        connectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
