// Home.js
import { useWallet } from '../components/WalletProvider';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { ethers } from 'ethers';

function Home() {
    const {
        register,
        handleSubmit,
        getValues,
        setValue,
        watch,
    } = useForm();

    const [accountBalance, setAccountBalance] = useState(0);

    const { account, balance, connectWallet, stakingTokenContract } = useWallet();

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

    return (
        <div>
            <div className="card">
                {
                    account ? (

                        <div className="wallet-info">

                            <h2>Connected Wallet Address: {account} </h2>
                            <h2>Balance: {balance} GINI</h2>
                        </div>) : (
                        <div className="wallet-info">
                            <h2>Connect your wallet</h2>
                        </div>)}
                <hr />
                {account ? (<div className="stake-section">
                    <h3>GINI TOKEN ADDRESS: {import.meta.env.VITE_GINI_ADDRESS}</h3>
                    <h3>STAKING FACTORY CONTRACT: {import.meta.env.VITE_STAKING_FACTORY_CONTRACT_ADDRESS}</h3>
                    <h3>Gini Token Balance</h3>
                    <div className="input-group">
                        <input type="text" placeholder="Enter address" {...register('balanceOfAddress')} className="input" />
                        <button onClick={() => handleBalanceOf(getValues('balanceOfAddress'))} className="btn btn-orange">Balance</button>
                        <h3>Balance :{accountBalance} Gini</h3>
                    </div>
                </div>) : (<div className="connect-wallet">
                    {/* <h3>Connect your wallet to stake GINI tokens</h3> */}
                    <button onClick={connectWallet} className="btn btn-orange">Connect Wallet</button>
                </div>)}
            </div>
        </div >
    );
}

export default Home;
