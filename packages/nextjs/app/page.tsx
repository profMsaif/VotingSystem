"use client";

import { useEffect, useState } from "react";
import deployedContracts from "../contracts/deployedContracts";
import type { NextPage } from "next";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [voterAddress, setVoterAddress] = useState("");

  const [selectedCandidate, setSelectedCandidate] = useState<bigint | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isOpened, setIsOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const contractAddress = deployedContracts[31337].VotingSystem.address;
  const contractABI = deployedContracts[31337].VotingSystem.abi;

  const { data: contractOwner } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "owner",
  });

  // Read functions
  const { data: candidatesData } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "getResults",
  });

  const { data: votingOpen } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "votingOpen",
  });

  useEffect(() => {
    if (connectedAddress && contractOwner) {
      setIsOwner(connectedAddress.toLowerCase() === contractOwner.toLowerCase());
    }
  }, [connectedAddress, contractOwner]);

  // Handle Write function
  const { writeContractAsync } = useWriteContract();

  const handleOpenVoting = async () => {
    try {
      const data = await writeContractAsync({
        address: contractAddress,
        abi: contractABI,
        functionName: "openVoting",
      });
      console.log("Transaction successful:", data);
      setIsOpen(true);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };

  const handleCloseVoting = async () => {
    try {
      const data = await writeContractAsync({
        address: contractAddress,
        abi: contractABI,
        functionName: "closeVoting",
      });
      console.log("Transaction successful:", data);
      setIsOpen(false);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };

  const handleRegisterVoter = async () => {
    try {
      const data = await writeContractAsync({
        address: contractAddress,
        abi: contractABI,
        functionName: "registerVoter",
        args: [voterAddress],
      });
      console.log("Transaction successful:", data);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };

  const handleAnnounceResults = async () => {
    setShowResults(!showResults);
  };

  // no idea why selectedCandidate is shiwing red
  const handleVote = async () => {
    try {
      const data = await writeContractAsync({
        address: contractAddress,
        abi: contractABI,
        functionName: "vote",
        args: [selectedCandidate],
      });
      console.log("Transaction successful:", data);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };

  useEffect(() => {
    if (candidatesData) setCandidates(candidatesData);
  }, [candidatesData]);

  const findWinner = () => {
    if (candidates.length === 0) return null;
    return candidates.reduce((max, candidate) => (candidate.voteCount > max.voteCount ? candidate : max));
  };

  const winner = findWinner();

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold">Voting System</span>
          </h1>
          <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
          </div>
          <div className="text-center text-lg mt-4">
            <p>{votingOpen ? "Voting is open" : "Voting is closed"}</p>
          </div>
        </div>

        <div className="flex-grow bg-base-300 w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
            {isOwner && (
              <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
                <button className="btn btn-primary" onClick={handleOpenVoting} disabled={isOpened}>
                  {isOpened ? "Opening Voting..." : "Open Voting"}
                </button>
                <button className="btn btn-secondary mt-4" onClick={handleCloseVoting}>
                  Close Voting
                </button>
                <button className="btn btn-accent mt-4" onClick={handleAnnounceResults}>
                  Announce Results
                </button>
                {showResults ? (
                  <div className="text-center mt-4">
                    <span>
                      The winner is : {winner ? `${winner.name} with ${winner.voteCount} votes` : "No votes yet"}
                    </span>
                  </div>
                ) : null}
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Voter Address"
                    value={voterAddress}
                    onChange={e => setVoterAddress(e.target.value)}
                    className="input input-bordered mb-4"
                  />
                  <button className="btn btn-primary" onClick={handleRegisterVoter}>
                    Register Voter
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <div className="flex flex-col mt-4">
                <select className="select select-bordered" onChange={e => setSelectedCandidate(BigInt(e.target.value))}>
                  <option value="">Select Candidate</option>
                  {candidates.length > 0 ? (
                    candidates.map((candidate, index) => (
                      <option key={index} value={candidate.id}>
                        {candidate.name} - Votes: {candidate.voteCount}
                      </option>
                    ))
                  ) : (
                    <option>No candidates</option>
                  )}
                </select>
                <button className="btn btn-secondary mt-4" onClick={handleVote} disabled={selectedCandidate === null}>
                  Vote
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
