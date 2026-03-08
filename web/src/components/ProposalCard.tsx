"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAccount } from "wagmi";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { Proposal } from "@/types/dao";
import { useGaslessVoting } from "@/hooks/useGaslessVoting";
import { ProposalVoteToast } from "./ProposalVoteToast";
import ProposalVoteModal from "./ProposalVoteModal";

interface ProposalCardProps {
  proposal: Proposal;
}

export default function ProposalCard({ proposal }: ProposalCardProps) {
  const { address, isConnected } = useAccount();

  const { isVoting, voteResult, submitVote, clearVoteResult } =
    useGaslessVoting();

  // State for user vote - will check localStorage on load
  const [userVote, setUserVote] = useState<number | null>(null);
  const [showVoteModal, setShowVoteModal] = useState(false);

  // Only show vote button after first client render to avoid hydration mismatch
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Check localStorage for previous votes for the connected account
    const savedVote = address
      ? localStorage.getItem(`vote-${proposal.proposalId}-${address}`)
      : null;
    if (savedVote) {
      setUserVote(parseInt(savedVote));
    } else {
      setUserVote(null); // Clear vote if not found for current address
    }
  }, [proposal.proposalId, address]);

  // Clear vote results and signatures when the user account changes
  useEffect(() => {
    clearVoteResult();
  }, [address, clearVoteResult]);

  const proposalState = useMemo(() => {
    // Skip timestamp checks until we're on the client
    if (!isClient) return "pending";

    const now = Math.floor(Date.now() / 1000);
    const isAfterStart = now >= Number(proposal.voteStart);
    const isBeforeEnd = now <= Number(proposal.voteEnd);
    const isActive = isAfterStart && isBeforeEnd && !proposal.executed;
    const isDefeated =
      !proposal.executed &&
      Number(proposal.forVotes) <= Number(proposal.againstVotes);

    if (proposal.executed) return "executed";
    if (!isAfterStart) return "pending";
    if (isActive) return "active";
    if (isDefeated) return "defeated";
    return "succeeded";
  }, [isClient, proposal]);

  // Use server component for consistent date formatting
  const formatDate = (date: Date): string => {
    // Ensure we have a valid date
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return "Invalid Date";
    }

    try {
      // Use the same formatting as server component
      return format(date, "MMM d, yyyy h:mm a", { locale: enUS });
    } catch {
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
  };

  // Memoized dates
  const createdDate = useMemo(
    () => new Date(Number(proposal.createdAt) * 1000),
    [proposal.createdAt],
  );

  // Format address for display
  const formatAddress = useCallback((addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, []);

  // Memoized vote calculations
  const { totalVotes, forPercentage, againstPercentage, abstainPercentage } =
    useMemo(() => {
      const total =
        Number(proposal.forVotes) +
        Number(proposal.againstVotes) +
        Number(proposal.abstainVotes);
      const forPct = total > 0 ? (Number(proposal.forVotes) / total) * 100 : 0;
      const againstPct =
        total > 0 ? (Number(proposal.againstVotes) / total) * 100 : 0;
      const abstainPct =
        total > 0 ? (Number(proposal.abstainVotes) / total) * 100 : 0;

      return {
        totalVotes: total,
        forPercentage: forPct,
        againstPercentage: againstPct,
        abstainPercentage: abstainPct,
      };
    }, [proposal.forVotes, proposal.againstVotes, proposal.abstainVotes]);

  // Handle vote submission with useCallback
  const handleVote = useCallback(
    async (support: 0 | 1 | 2) => {
      if (!isConnected || !address) return;

      try {
        const result = await submitVote({
          proposalId: Number(proposal.proposalId),
          support,
        });

        if (result.success) {
          // Save vote to localStorage, associated with the voter's address
          localStorage.setItem(
            `vote-${proposal.proposalId}-${address}`,
            support.toString(),
          );
          setUserVote(support);
          setShowVoteModal(false);
        }
      } catch (err) {
        console.error("Error voting:", err);
      }
    },
    [isConnected, address, submitVote, proposal.proposalId],
  );

  // Get state badge with consistent styling
  const getStateBadge = useCallback(() => {
    const stateConfig = {
      executed: { className: "bg-green-100 text-green-800", label: "Executed" },
      defeated: { className: "bg-red-100 text-red-800", label: "Defeated" },
      pending: { className: "bg-yellow-100 text-yellow-800", label: "Pending" },
      active: { className: "bg-blue-100 text-blue-800", label: "Active" },
      succeeded: {
        className: "bg-green-100 text-green-800",
        label: "Succeeded",
      },
    };

    const config = stateConfig[proposalState];
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}
      >
        {config.label}
      </span>
    );
  }, [proposalState]);

  // Progress bar component for better reusability
  const ProgressBar = useCallback(
    ({
      percentage,
      color,
      label,
      value,
    }: {
      percentage: number;
      color: string;
      label: string;
      value: string;
    }) => {
      // Ensure minimum width for visibility when there are votes
      const displayWidth = percentage > 0 && percentage < 2 ? 2 : percentage;

      return (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-medium">{label}</span>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-white">
                {percentage.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400">({value} votes)</span>
            </div>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-2.5 overflow-hidden border border-slate-600/30">
            <div
              className={`${color} h-2.5 rounded-full transition-all duration-500 ease-out`}
              style={{ width: `${displayWidth}%` }}
            ></div>
          </div>
        </div>
      );
    },
    [],
  );

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-600/50 overflow-hidden hover:border-purple-500/50 transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-slate-600/50 bg-slate-700/30">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">
              Proposal #{proposal.proposalId.toString()}
            </h3>
            {getStateBadge()}
          </div>

          <div className="text-right">
            <p className="text-sm text-slate-300">
              Created {formatDate(createdDate)}
            </p>
            <p className="text-xs text-slate-400">
              by {formatAddress(proposal.creator)}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-slate-100 mb-4 leading-relaxed">
          {proposal.description}
        </p>

        {/* Voting Info */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm text-slate-300 mb-2">
            <span>Vote Distribution</span>
            <span>{totalVotes} votes</span>
          </div>

          {/* Progress bars */}
          <div className="space-y-3">
            <ProgressBar
              percentage={forPercentage}
              color="bg-green-500"
              label="For"
              value={proposal.forVotes.toString()}
            />

            <ProgressBar
              percentage={againstPercentage}
              color="bg-red-500"
              label="Against"
              value={proposal.againstVotes.toString()}
            />

            <ProgressBar
              percentage={abstainPercentage}
              color="bg-blue-500"
              label="Abstain"
              value={proposal.abstainVotes.toString()}
            />
          </div>
        </div>

        {/* Vote Actions */}
        {isClient &&
        proposalState === "active" &&
        isConnected &&
        userVote === null ? (
          <div className="px-4 pb-4">
            <button
              onClick={() => setShowVoteModal(true)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Vote on this proposal
            </button>
          </div>
        ) : isClient &&
          proposalState === "active" &&
          isConnected &&
          userVote !== null ? (
          <div className="px-4 pb-4">
            <p className="text-slate-300 text-sm text-center">
              You voted{" "}
              {userVote === 0 ? "for" : userVote === 1 ? "against" : "abstain"}
            </p>
          </div>
        ) : isClient && proposalState === "active" && !isConnected ? (
          <div className="px-4 pb-4">
            <p className="text-slate-400 text-sm text-center">
              Connect wallet to vote
            </p>
          </div>
        ) : null}

        <ProposalVoteModal
          proposal={proposal}
          isOpen={showVoteModal}
          isVoting={isVoting}
          onClose={() => setShowVoteModal(false)}
          onVote={handleVote}
        />

        <ProposalVoteToast voteResult={voteResult} onClose={clearVoteResult} />
      </div>
    </div>
  );
}
