// src/pages/Admin.jsx
import { useForm } from 'react-hook-form';
import { useWallet } from '../components/WalletProvider';
import { ethers } from 'ethers';
import { useState, useEffect } from 'react';
import stakingContractAbi from '../contracts/stakingContract.json';

function Admin() {
    const { register, handleSubmit, getValues } = useForm();
    const { stakingFactoryContract, signer, stakingTokenContract, account } = useWallet();
    const [txHash, setTxHash] = useState(null);
    const [stakingContracts, setStakingContracts] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {

        if (signer && stakingFactoryContract) {
            console.log("Fetching staking contracts...");
            fetchStakingContracts();
        }
    }, [signer, stakingFactoryContract]);

    const createStakingContract = async (stakingToken, startTime, endTime, adminAddress) => {
        if (!stakingFactoryContract || !signer) {
            setError("Wallet not connected or contract not loaded.");
            return;
        }

        try {
            setLoading(true);
            const tx = await stakingFactoryContract.createStakingPool(
                stakingToken,
                startTime,
                endTime,
                300,
                100,
                adminAddress
            );
            await tx.wait();
            setTxHash(tx.hash);
            setError(null);
        } catch (err) {
            console.error("Transaction failed:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchStakingContracts = async () => {
        try {
            const count = await stakingFactoryContract.getStakingPoolCount();
            console.log("Staking Pool Count:", count.toString());
            const allPools = [];

            for (let i = 0; i < count; i++) {
                const stakingContractRes = await stakingFactoryContract.stakingPools(i);
                const stakingAddress = stakingContractRes.stakingContract;
                const stakingContract = new ethers.Contract(stakingAddress, stakingContractAbi, signer);

                const [
                    admin,
                    rewardPool,
                    totalStakedToken,
                    startTime,
                    endTime,
                    remainingReward,
                    stakers
                ] = await Promise.all([
                    stakingContractRes.admin,
                    stakingContract.rewardPool(),
                    stakingContract.totalStakedTokens(),
                    stakingContract.stakingStartTime(),
                    stakingContract.stakingEndTime(),
                    stakingContract.remainingRewards(),
                    //   stakingContract.stakersArray(i), // this assumes it exists and is public
                ]);

                allPools.push({
                    index: i,
                    address: stakingAddress,
                    admin,
                    rewardPool: ethers.formatEther(rewardPool),
                    totalStakedToken: ethers.formatEther(totalStakedToken),
                    startTime: new Date(Number(startTime) * 1000).toLocaleString(),
                    endTime: new Date(Number(endTime) * 1000).toLocaleString(),
                    remainingReward: ethers.formatEther(remainingReward),
                    //   stakers,
                    isEnded: Number(endTime) < Date.now() / 1000,
                    stakingContract
                });
            }

            setStakingContracts(allPools);

        } catch (error) {
            console.error("Error fetching staking contracts:", error);
            setError(error.message);

        }

    };




    // Add handlers here
    const handleDepositReward = async (stakingContract, amount) => {
        try {
            const approveTx = await stakingTokenContract.approve(stakingContract.target, ethers.parseEther(amount.toString()));
            await approveTx.wait();
            const tx = await stakingContract.depositReward(ethers.parseEther(amount.toString()));
            await tx.wait();
            await fetchStakingContracts();
        } catch (error) {
            console.error("Error depositing reward:", error);
            setError(error.message);

        }
    };

    const handleWithdrawRemainingTokens = async (stakingContract, receipient) => {
        try {
            const tx = await stakingContract.withdrawRemainingTokens(receipient);
            await tx.wait();
            await fetchStakingContracts();
        } catch (error) {
            console.error("Error withdrawing remaining tokens:", error);
            setError(error.message);

        }
    };


    return (
        <div className="admin-container">
            <div className="admin-page">

                <h2>Admin Panel</h2>
                {account ? (<h3><span style={{ color: "lightGreen" }}>Connected : </span> Wallet Address: {account}</h3>) : (<h3><span style={{ color: "lightRed" }}> Go to Home & Connect your wallet</span></h3>)}
                <hr />

                <div className="create-staking-contract">
                    <h4>Create Staking Contract</h4>
                    <form
                        onSubmit={handleSubmit(() => {
                            const rawStart = getValues('startTime');
                            const rawEnd = getValues('endTime');

                            const startTime = Math.floor(new Date(rawStart).getTime() / 1000);
                            const endTime = Math.floor(new Date(rawEnd).getTime() / 1000);

                            createStakingContract(
                                getValues('stakingTokenAddress'),
                                startTime,
                                endTime,
                                getValues('adminAddress')
                            );
                        })}
                    >
                        <table>
                            <tbody>
                                <tr>
                                    <td><label htmlFor="stakingTokenAddress">Staking Token Address</label></td>
                                    <td>
                                        <input id="stakingTokenAddress" type="text" placeholder="0x..." {...register('stakingTokenAddress')} className="input" />
                                    </td>
                                </tr>
                                <tr>
                                    <td><label htmlFor="startTime">Start Time</label></td>
                                    <td>
                                        <input id="startTime" type="datetime-local" {...register('startTime')} className="input" />
                                    </td>
                                </tr>
                                <tr>
                                    <td><label htmlFor="endTime">End Time</label></td>
                                    <td>
                                        <input id="endTime" type="datetime-local" {...register('endTime')} className="input" />
                                    </td>
                                </tr>
                                <tr>
                                    <td><label htmlFor="adminAddress">Admin Address</label></td>
                                    <td>
                                        <input id="adminAddress" type="text" placeholder="0x..." {...register('adminAddress')} className="input" />
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan="2" style={{ textAlign: "center", paddingTop: "10px" }}>
                                        <button type="submit" className="btn btn-orange" disabled={loading}>
                                            {loading ? "Creating..." : "Create Staking Contract"}
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </form>
                </div>
                {txHash && (
                    <div style={{ marginTop: "20px", color: "green", backgroundColor: "white", padding: "5px", borderRadius: "5px" }}>
                        Contract created! <br />
                        TX: <a href={`https://amoy.polygonscan.com/tx/${txHash}`} target="_blank" rel="noreferrer">{txHash}</a>
                    </div>
                )}
            </div>
            <hr />
            <div className="staking-contract-info">
                <div>
                    <h2>Staking Contracts Overview</h2>
                    <table style={{ width: '90%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ border: '1px solid #ddd', padding: '8px 5px', fontWeight: 'bold', textAlign: 'center', }}>Index</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px 5px', fontWeight: 'bold', textAlign: 'center', }}>Address</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px 5px', fontWeight: 'bold', textAlign: 'center', }}>Admin</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px 5px', fontWeight: 'bold', textAlign: 'center', }}>Reward Pool</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px 5px', fontWeight: 'bold', textAlign: 'center', }}>Total Staked</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px 5px', fontWeight: 'bold', textAlign: 'center', }}>Start</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px 5px', fontWeight: 'bold', textAlign: 'center', }}>End</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px 5px', fontWeight: 'bold', textAlign: 'center', }}>Remaining Reward</th>
                                {/* <th>Stakers</th> */}
                                <th style={{ border: '1px solid #ddd', padding: '8px 5px', fontWeight: 'bold', textAlign: 'center', }}>Deposit Reward</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px 5px', fontWeight: 'bold', textAlign: 'center', }}>Withdraw Leftover</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stakingContracts.map((pool, index) => (
                                <tr key={index}>
                                    <td style={{ border: '1px solid #ddd', padding: '8px 5px', textAlign: 'center', }}>{pool.index}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px 5px', textAlign: 'center', }}>{pool.address}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px 5px', textAlign: 'center', }}>{pool.admin}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px 5px', textAlign: 'center', }}>{pool.rewardPool}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px 5px', textAlign: 'center', }}>{pool.totalStakedToken}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px 5px', textAlign: 'center', }}>{pool.startTime}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px 5px', textAlign: 'center', }}>{pool.endTime}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px 5px', textAlign: 'center', }}>{pool.remainingReward}</td>
                                    {/* <td>{pool.stakers.join(", ")}</td> */}
                                    <td style={{ border: '1px solid #ddd', padding: '8px 5px', textAlign: 'center', }}>
                                        <input
                                            type="number"
                                            placeholder="Amount"
                                            onChange={(e) => pool.depositAmount = e.target.value}
                                        />
                                        <button onClick={() => handleDepositReward(pool.stakingContract, pool.depositAmount)} className="btn btn-orange" >
                                            Deposit
                                        </button>
                                    </td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px 5px', textAlign: 'center', }}>
                                        {pool.isEnded && (
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="Receipient"
                                                    onChange={(e) => pool.receipient = e.target.value}
                                                />
                                                <button onClick={() => handleWithdrawRemainingTokens(pool.stakingContract, pool.receipient)} className="btn btn-orange" >
                                                    Withdraw
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {
                error && (
                    <div style={{ marginTop: "20px", color: "red" }}>
                        Error: {error}
                    </div>
                )
            }
        </div >
    );
}

export default Admin;
