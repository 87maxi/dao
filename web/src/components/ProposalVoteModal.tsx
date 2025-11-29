"use client";

import { Transition, Dialog } from '@headlessui/react';
import { Fragment } from 'react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Proposal } from '@/types/dao';
import { XMarkIcon, CheckCircleIcon, XCircleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface ProposalVoteModalProps {
  proposal: Proposal;
  isOpen: boolean;
  isVoting: boolean;
  onClose: () => void;
  onVote: (support: 1 | 2 | 3) => void;
}

export default function ProposalVoteModal({
  proposal,
  isOpen,
  isVoting,
  onClose,
  onVote
}: ProposalVoteModalProps) {
  const formatDate = (date: Date): string => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    try {
      return format(date, 'MMM d, yyyy h:mm a', { locale: enUS });
    } catch {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  const formatBigInt = (value: bigint): string => {
    return Number(value).toLocaleString();
  };

  // Calculate vote percentages
  const totalVotes = Number(proposal.forVotes) + Number(proposal.againstVotes) + Number(proposal.abstainVotes);
  const forPercentage = totalVotes > 0 ? (Number(proposal.forVotes) / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? (Number(proposal.againstVotes) / totalVotes) * 100 : 0;
  const abstainPercentage = totalVotes > 0 ? (Number(proposal.abstainVotes) / totalVotes) * 100 : 0;

  const winningOption = () => {
    if (forPercentage > againstPercentage && forPercentage > abstainPercentage) return 'For';
    if (againstPercentage > forPercentage && againstPercentage > abstainPercentage) return 'Against';
    if (abstainPercentage > forPercentage && abstainPercentage > againstPercentage) return 'Abstain';
    return 'Tied';
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border border-purple-500/30 shadow-2xl transition-all w-full max-w-2xl">
                {/* Close button */}
                <div className="absolute top-4 right-4 z-10">
                  <button
                    type="button"
                    className="rounded-lg bg-slate-700/50 p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                <div className="p-6 sm:p-8">
                  {/* Header */}
                  <div className="mb-6">
                    <Dialog.Title className="text-2xl font-bold text-white mb-2">
                      Vote on Proposal #{proposal.proposalId.toString()}
                    </Dialog.Title>
                    <p className="text-sm text-purple-300">Cast your vote to participate in DAO governance</p>
                  </div>

                  <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                    {/* Proposal Description */}
                    <div className="bg-slate-700/30 backdrop-blur-sm rounded-xl p-4 border border-slate-600/50">
                      <label className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-2 block">
                        Proposal Details
                      </label>
                      <p className="text-slate-100 leading-relaxed">
                        {proposal.description}
                      </p>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg p-3 border border-slate-600/50">
                        <span className="text-xs font-medium text-purple-300 block mb-1">Proposal ID</span>
                        <span className="text-white font-mono text-sm">#{proposal.proposalId.toString()}</span>
                      </div>

                      <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg p-3 border border-slate-600/50">
                        <span className="text-xs font-medium text-purple-300 block mb-1">Created</span>
                        <span className="text-white text-xs">{formatDate(new Date(Number(proposal.createdAt) * 1000))}</span>
                      </div>

                      <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg p-3 border border-slate-600/50">
                        <span className="text-xs font-medium text-purple-300 block mb-1">Voting Ends</span>
                        <span className="text-white text-xs">{formatDate(new Date(Number(proposal.voteEnd) * 1000))}</span>
                      </div>

                      <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg p-3 border border-slate-600/50">
                        <span className="text-xs font-medium text-purple-300 block mb-1">Proposed By</span>
                        <span className="text-white font-mono text-xs">{proposal.creator.slice(0, 6)}...{proposal.creator.slice(-4)}</span>
                      </div>
                    </div>

                    {/* Vote Statistics */}
                    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm rounded-xl p-5 border border-purple-500/30">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-purple-200 uppercase tracking-wider">Current Results</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">{totalVotes} total votes</span>
                          <span className="px-2 py-1 bg-purple-500/20 rounded text-xs font-medium text-purple-300">
                            Leading: {winningOption()}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* For Votes */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="flex items-center text-green-400 font-medium">
                              <CheckCircleIcon className="h-4 w-4 mr-2" />
                              For
                            </span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg font-bold text-green-400">{forPercentage.toFixed(1)}%</span>
                              <span className="text-sm text-slate-400">({formatBigInt(proposal.forVotes)} votes)</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all duration-500 shadow-lg shadow-green-500/50"
                              style={{ width: `${forPercentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Against Votes */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="flex items-center text-red-400 font-medium">
                              <XCircleIcon className="h-4 w-4 mr-2" />
                              Against
                            </span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg font-bold text-red-400">{againstPercentage.toFixed(1)}%</span>
                              <span className="text-sm text-slate-400">({formatBigInt(proposal.againstVotes)} votes)</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-red-500 to-red-400 h-3 rounded-full transition-all duration-500 shadow-lg shadow-red-500/50"
                              style={{ width: `${againstPercentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Abstain Votes */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="flex items-center text-blue-400 font-medium">
                              <QuestionMarkCircleIcon className="h-4 w-4 mr-2" />
                              Abstain
                            </span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg font-bold text-blue-400">{abstainPercentage.toFixed(1)}%</span>
                              <span className="text-sm text-slate-400">({formatBigInt(proposal.abstainVotes)} votes)</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-blue-400 h-3 rounded-full transition-all duration-500 shadow-lg shadow-blue-500/50"
                              style={{ width: `${abstainPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Vote Buttons */}
                    <div className="space-y-3 pt-2">
                      <h3 className="text-sm font-semibold text-purple-200 uppercase tracking-wider mb-3">Cast Your Vote</h3>

                      <button
                        onClick={() => onVote(1)}
                        disabled={isVoting}
                        className="group w-full p-4 bg-gradient-to-r from-green-600/20 to-green-500/20 hover:from-green-600/30 hover:to-green-500/30 rounded-xl border-2 border-green-500/30 hover:border-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:shadow-green-500/20"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <CheckCircleIcon className="h-6 w-6 text-green-400 mr-3" />
                            <div className="text-left">
                              <div className="font-bold text-green-400 text-lg">Vote For</div>
                              <div className="text-sm text-slate-300">Support this proposal</div>
                            </div>
                          </div>
                          <div className="text-2xl group-hover:translate-x-1 transition-transform">→</div>
                        </div>
                      </button>

                      <button
                        onClick={() => onVote(2)}
                        disabled={isVoting}
                        className="group w-full p-4 bg-gradient-to-r from-red-600/20 to-red-500/20 hover:from-red-600/30 hover:to-red-500/30 rounded-xl border-2 border-red-500/30 hover:border-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:shadow-red-500/20"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <XCircleIcon className="h-6 w-6 text-red-400 mr-3" />
                            <div className="text-left">
                              <div className="font-bold text-red-400 text-lg">Vote Against</div>
                              <div className="text-sm text-slate-300">Oppose this proposal</div>
                            </div>
                          </div>
                          <div className="text-2xl group-hover:translate-x-1 transition-transform">→</div>
                        </div>
                      </button>

                      <button
                        onClick={() => onVote(3)}
                        disabled={isVoting}
                        className="group w-full p-4 bg-gradient-to-r from-blue-600/20 to-blue-500/20 hover:from-blue-600/30 hover:to-blue-500/30 rounded-xl border-2 border-blue-500/30 hover:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <QuestionMarkCircleIcon className="h-6 w-6 text-blue-400 mr-3" />
                            <div className="text-left">
                              <div className="font-bold text-blue-400 text-lg">Abstain</div>
                              <div className="text-sm text-slate-300">Abstain from voting</div>
                            </div>
                          </div>
                          <div className="text-2xl group-hover:translate-x-1 transition-transform">→</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
