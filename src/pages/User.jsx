import { useEffect, useState } from "react";
import { ethers } from "ethers";
import stakingContractAbi from "../contracts/stakingContract.json";
import { useWallet } from "../components/WalletProvider";

function UserStakes() {
    const { stakingFactoryContract, signer, stakingTokenContract, account } = useWallet();

    const [userStakingContracts, setUserStakingContracts] = useState([]);
    const [unstakedContracts, setUnstakedContracts] = useState([]);

    useEffect(() => {
        // console.log("UserStakes: ", account, stakingFactoryContract, signer);
        if (account && stakingFactoryContract && signer) {
            fetchUserStakes();
        }
    }, [account, signer, stakingFactoryContract]);

    const fetchUserStakes = async () => {

        console.log("Fetching user stakes...");

        setUserStakingContracts([]);
        setUnstakedContracts([]);
        const count = await stakingFactoryContract.getStakingPoolCount();
        const userStakingContracts = [];
        const unstakedContracts = [];

        for (let i = 0; i < count; i++) {
            const stakingContractRes = await stakingFactoryContract.stakingPools(i);
            const stakingAddress = stakingContractRes.stakingContract;
            const stakingContract = new ethers.Contract(stakingAddress, stakingContractAbi, signer);
            //   console.log("Staking Address: ", stakingAddress);

            const [hasStaked, startTime, endTime, rewardPool, totalStaked] = await Promise.all([
                stakingContract.hasStaked(account),
                stakingContract.stakingStartTime(),
                stakingContract.stakingEndTime(),
                stakingContract.rewardPool(),
                stakingContract.totalStakedTokens()
            ]);

            const currentTime = Date.now() / 1000;


            if (hasStaked) {
                console.log("User has staked in this contract", stakingAddress);
                const userStakes = await stakingContract.getUserStakes(account);
                const stakesWithRewards = await Promise.all(
                    userStakes.map(async (stake, index) => {
                        const [stakedTokens, stakeTimestamp, withdrawalTimestamp] = stake;
                        let reward = 0
                        if (!withdrawalTimestamp) { reward = await stakingContract.getRewards(index); }

                        return {
                            stakedTokens,
                            stakeTimestamp,
                            withdrawalTimestamp,
                            reward,
                            index,
                        };
                    })
                );

                userStakingContracts.push({
                    index: i,
                    address: stakingAddress,
                    startTime: Number(startTime),
                    endTime: Number(endTime),
                    totalStaked: ethers.formatEther(totalStaked),
                    stakes: stakesWithRewards,
                    contractInstance: stakingContract,
                });
            } else if (Number(endTime) > currentTime) {
                unstakedContracts.push({
                    index: i,
                    address: stakingAddress,
                    startTime: Number(startTime),
                    endTime: Number(endTime),
                    totalStaked: ethers.formatEther(totalStaked),
                    rewardPool: ethers.formatEther(rewardPool),
                    contractInstance: stakingContract,
                });
            }

        }
        setUserStakingContracts(userStakingContracts);
        setUnstakedContracts(unstakedContracts);
    }

    const formatTimestamp = (ts) => {
        if (Number(ts) === 0) return "-";
        return new Date(Number(ts) * 1000).toLocaleString();
    };

    const getStatus = (withdrawalTimestamp, endTime) => {
        try {
            if (Number(withdrawalTimestamp) !== 0) {
                if (Number(withdrawalTimestamp) < Number(endTime)) {
                    return "Early Withdrawn";
                } else return "Already Withdrawn";
            }
            if (Date.now() / 1000 > Number(endTime)) return "Ready for Withdrawn";
            return "Staking in Progress";

        } catch (error) {
            console.error("Error getting status: ", error);
            return "Error";
        }


    };

    const handleWithdraw = async (stakingContract, index, withReward = true) => {
        try {
            const tx = withReward
                ? await stakingContract.withdrawWithReward(index)
                : await stakingContract.earlyWithdraw(index);
            await tx.wait();
            await fetchUserStakes();

        } catch (error) {
            console.error("Error withdrawing: ", error);
            alert("Error withdrawing: " + error.message);
        }
    };

    const handleApprove = async (stakingContract, amount) => {
        try {
            const approveTx = await stakingTokenContract.approve(stakingContract.target, ethers.parseEther(amount.toString()));
            await approveTx.wait();
        } catch (error) {
            console.error("Error approving tokens:", error);
            setError(error.message);

        }

    }

    const handleStake = async (stakingContract, amount) => {
        try {
            const tx = await stakingContract.stake(ethers.parseEther(amount));
            await tx.wait();
            await fetchUserStakes();
        } catch (error) {
            console.error("Error staking: ", error);
            alert("Error staking: " + error.message);
        }
    }


    return (
        <div><h2>User's Section</h2>
            {account ? (<h3><span style={{ color: "lightGreen" }}>Connected : </span> Wallet Address: {account}</h3>) : (<h3><span style={{ color: "lightRed" }}> Go to Home & Connect your wallet</span></h3>)}
            <hr />
            <h2>Your Stakings</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {userStakingContracts.map((item, i) => (
                    <div key={i} style={{ border: "1px solid #ccc", padding: "16px", width: "100%" }}>
                        <h3>Staking #{item.index}</h3>
                        <p><b>Contract:</b> {item.address}</p>
                        <p><b>Start Time:</b> {formatTimestamp(item.startTime)}</p>
                        <p><b>End Time:</b> {formatTimestamp(item.endTime)}</p>
                        <p><b>Total Staked:</b> {item.totalStaked} Tokens</p>

                        <table style={{ width: "100%", margin: "10px", padding: "10px", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #ccc", margin: "20px", textAlign: "center" }}>
                                    <th>Staked Tokens</th>
                                    <th>Stake Timestamp</th>
                                    <th>Withdraw Timestamp</th>
                                    <th>Status</th>
                                    <th>Reward</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {item.stakes.map((stake, sIndex) => (
                                    <tr key={sIndex} style={{ borderBottom: "1px solid #eee", textAlign: "center" }}>
                                        <td>{ethers.formatEther(stake.stakedTokens)}</td>
                                        <td>{formatTimestamp(stake.stakeTimestamp)}</td>
                                        <td>{formatTimestamp(stake.withdrawalTimestamp)}</td>
                                        <td>{getStatus(stake.withdrawalTimestamp, item.endTime)}</td>
                                        <td>{stake.reward ? ethers.formatEther(stake.reward) : `0`}</td>
                                        <td>
                                            <button
                                                onClick={() => handleWithdraw(item.contractInstance, stake.index, true)}
                                                disabled={Number(stake.withdrawalTimestamp) !== 0 || Date.now() / 1000 < item.endTime}
                                            >
                                                Withdraw With Reward
                                            </button>
                                            &nbsp;
                                            <button
                                                onClick={() => handleWithdraw(item.contractInstance, stake.index, false)}
                                                disabled={Number(stake.withdrawalTimestamp) !== 0 || Date.now() / 1000 > item.endTime}
                                            >
                                                Early Withdraw
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <input
                            type="number"
                            placeholder="Stake Amount"
                            onChange={(e) => item.stakeAmount = e.target.value}
                            style={{ marginRight: "10px" }} className="input"
                        />
                        <button onClick={() => handleApprove(item.contractInstance, item.stakeAmount)}>
                            Approve
                        </button>
                        <button onClick={() => handleStake(item.contractInstance, item.stakeAmount)}
                            disabled={Date.now() / 1000 > item.endTime}>
                            Stake Again
                        </button>
                    </div>
                ))}
            </div>
            <div style={{ marginTop: "40px" }}>
                <div>
                    {unstakedContracts.length > 0 && (
                        <div style={{ marginTop: "40px" }}>
                            <h2>Available Staking Pools</h2>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
                                {unstakedContracts.map((item, i) => (
                                    <div key={i} style={{ border: "1px solid #ccc", padding: "16px", width: "100%" }}>
                                        <h3>Staking #{item.index}</h3>
                                        <p><b>Contract:</b> {item.address}</p>
                                        <p><b>Start Time:</b> {formatTimestamp(item.startTime)}</p>
                                        <p><b>End Time:</b> {formatTimestamp(item.endTime)}</p>
                                        <p><b>Reward Pool:</b> {item.rewardPool} Tokens</p>
                                        <p><b>Total Staked:</b> {item.totalStaked} Tokens</p>
                                        <input
                                            type="number"
                                            placeholder="Amount to stake"
                                            onChange={(e) => item.stakeAmount = e.target.value}
                                            style={{ margin: "5px" }}
                                        />
                                        <button onClick={() => handleApprove(item.contractInstance, item.stakeAmount)}>
                                            Approve
                                        </button>
                                        <button onClick={() => handleStake(item.contractInstance, item.stakeAmount)}>
                                            Stake
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>


    );
}


export default UserStakes;
