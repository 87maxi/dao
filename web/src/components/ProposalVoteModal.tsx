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
    // Ensure we have a valid date
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    try {
      // Use the same formatting as server component
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

  // Format bigints to numbers for display
  const formatBigInt = (value: bigint): string => {
    return Number(value).toLocaleString();
  };

  // Calculate vote percentages
  const totalVotes = Number(proposal.forVotes) + Number(proposal.againstVotes) + Number(proposal.abstainVotes);
  const forPercentage = totalVotes > 0 ? (Number(proposal.forVotes) / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? (Number(proposal.againstVotes) / totalVotes) * 100 : 0;
  const abstainPercentage = totalVotes > 0 ? (Number(proposal.abstainVotes) / totalVotes) * 100 : 0;

  
  // Determine winner
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
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-slate-800 px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button
                    type="button"
                    className="rounded-md bg-slate-800 text-slate-400 hover:text-slate-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                                    <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex flex-col space-y-4 max-h-[70vh] overflow-y-auto">
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-semibold leading-6 text-white"
                      >
                        Vote on Proposal #{proposal.proposalId.toString()}
                      </Dialog.Title>
                      
                      {/* Proposal Information */}
                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="text-xs font-medium text-purple-200 uppercase tracking-wider">Proposal Details</label>
                          <p className="text-slate-100 mt-1 leading-relaxed bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                            {proposal.description}
                          </p>
                        </div>
                        
                        {/* Proposal Metadata */}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                            <span className="font-medium text-purple-200">Proposal ID</span>
                            <span className="text-slate-100 font-mono text-sm">#{proposal.proposalId.toString()}</span>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                            <span className="font-medium text-purple-200">Created</span>
                            <span className="text-slate-100">{formatDate(new Date(Number(proposal.createdAt) * 1000))}</span>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                            <span className="font-medium text-purple-200">Voting Start</span>
                            <span className="text-slate-100">{formatDate(new Date(Number(proposal.voteStart) * 1000))}</span>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                            <span className="font-medium text-purple-200">Deadline</span>
                            <span className="text-slate-100">{formatDate(new Date(Number(proposal.voteEnd) * 1000))}</span>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                            <span className="font-medium text-purple-200">Proposed By</span>
                            <span className="text-slate-100 font-mono text-sm">{proposal.creator.slice(0, 6)}...{proposal.creator.slice(-4)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Vote Statistics */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-purple-200 uppercase tracking-wider">Vote Statistics</label>
                          <span className="text-xs text-slate-400">{totalVotes} votes (Winner: {winningOption()})</span>
                        </div>
                        
                        {/* For Votes */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center text-green-400">
                              <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                              <span className="font-medium">For</span>
                            </span>
                            <div className="flex items-baseline space-x-2">
                              <span className="text-sm font-bold text-green-400">{forPercentage.toFixed(1)}%</span>
                              <span className="text-xs text-slate-400">({formatBigInt(proposal.forVotes)})</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-600 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: `${forPercentage}%` }}></div>
                          </div>
                        </div>
                        
                        {/* Against Votes */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center text-red-400">
                              <XCircleIcon className="h-4 w-4 mr-1.5" />
                              <span className="font-medium">Against</span>
                            </span>
                            <div className="flex items-baseline space-x-2">
                              <span className="text-sm font-bold text-red-400">{againstPercentage.toFixed(1)}%</span>
                              <span className="text-xs text-slate-400">({formatBigInt(proposal.againstVotes)})</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-600 rounded-full h-2">
                            <div className="bg-red-500 h-2 rounded-full transition-all duration-300" style={{ width: `${againstPercentage}%` }}></div>
                          </div>
                        </div>
                        
                        {/* Abstain Votes */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center text-blue-400">
                              <QuestionMarkCircleIcon className="h-4 w-4 mr-1.5" />
                              <span className="font-medium">Abstain</span>
                            </span>
                            <div className="flex items-baseline space-x-2">
                              <span className="text-sm font-bold text-blue-400">{abstainPercentage.toFixed(1)}%</span>
                              <span className="text-xs text-slate-400">({formatBigInt(proposal.abstainVotes)})</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-600 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${abstainPercentage}%` }}></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Vote Options */}
                      <div className="space-y-3 mt-6">
                        <div className="pt-4 border-t border-slate-600">
                          <button
                            onClick={() => onVote(1)}
                            disabled={isVoting}
                            className="w-full p-3 text-left bg-green-600/20 hover:bg-green-600/30 rounded-lg border border-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <div className="font-medium text-green-400 flex items-center">
                              <CheckCircleIcon className="h-4 w-4 mr-2" fill="currentColor" />
                              For
                            </div>
                            <div className="text-sm text-slate-300">Support this proposal</div>
                          </button>
                          
                          <button
                            onClick={() => onVote(2)}
                            disabled={isVoting}
                            className="w-full p-3 text-left bg-red-600/20 hover:bg-red-600/30 rounded-lg border border-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <div className="font-medium text-red-400 flex items-center">
                              <XCircleIcon className="h-4 w-4 mr-2" fill="currentColor" />
                              Against
                            </div>
                            <div className="text-sm text-slate-300">Oppose this proposal</div>
                          </button>
                          
                          <button
                            onClick={() => onVote(3)}
                            disabled={isVoting}
                            className="w-full p-3 text-left bg-blue-600/20 hover:bg-blue-600/30 rounded-lg border border-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <div className="font-medium text-blue-400 flex items-center">
                              <QuestionMarkCircleIcon className="h-4 w-4 mr-2" fill="currentColor" />
                              Abstain
                            </div>
                            <div className="text-sm text-slate-300">Abstain from voting</div>
                          </button>
                        </div>
                      </div>
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
