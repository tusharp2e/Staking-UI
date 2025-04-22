import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function useWallet() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const _provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await _provider.send("eth_requestAccounts", []);
        const _signer = await _provider.getSigner();
        const address = await _signer.getAddress();
        const balanceWei = await _provider.getBalance(address);
        const ethBalance = ethers.formatEther(balanceWei);

        setAccount(address);
        setBalance(parseFloat(ethBalance).toFixed(4));
        setProvider(_provider);
        setSigner(_signer);
      } catch (err) {
        console.error("Wallet connection error:", err);
      }
    } else {
      alert("Please install MetaMask.");
    }
  };

  return { account, balance, provider, signer, connectWallet };
}
