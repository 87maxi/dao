"use client";

import { useState, useEffect } from "react";
import { useAccount } from 'wagmi';
import { ProposalForm } from '@/types/dao';
import { useCreateProposal } from '@/hooks/useCreateProposal';

interface CreateProposalProps {
  onProposalCreated?: () => void;
}

export default function CreateProposal({ onProposalCreated }: CreateProposalProps) {
  const { address, isConnected } = useAccount();

  const [formValues, setFormValues] = useState<ProposalForm>({
    title: '',
    description: '',
    deadline: 0 // Initialize with 0 to match server render
  });

  // Set default deadline on client-side only after mount
  useEffect(() => {
    if (formValues.deadline === 0) {
      const defaultDeadline = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
      setFormValues(prev => ({
        ...prev,
        deadline: defaultDeadline
      }));
    }
  }, []); // Run once on mount

  const {
    isPending,
    isSuccess,
    isError,
    error,
    createProposal,
    reset
  } = useCreateProposal();

  const [uiError, setUiError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: name === 'deadline' ? Number(value) : value
    }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timestamp = e.target.value ? Math.floor(new Date(e.target.value).getTime() / 1000) : 0;
    setFormValues(prev => ({
      ...prev,
      deadline: timestamp
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset states
    setUiError(null);

    if (!isConnected) {
      setUiError('Wallet not connected');
      return;
    }

    if (!formValues.title?.trim()) {
      setUiError('Proposal title is required');
      return;
    }

    if (!formValues.description?.trim()) {
      setUiError('Proposal description is required');
      return;
    }

    try {
      // Create the proposal
      await createProposal(formValues);

      if (onProposalCreated) {
        onProposalCreated();
      }

    } catch (err) {
      console.error('Error creating proposal:', err);
    }
  };

  const handleReset = () => {
    const defaultDeadline = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
    setFormValues({
      title: '',
      description: '',
      deadline: defaultDeadline
    });
    reset();
    setUiError(null);
  };

  // Show success message if proposal was created
  if (isSuccess) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-6 mb-8">
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707-9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-green-400 font-medium">Proposal Created Successfully!</h3>
              <p className="text-green-300 text-sm mt-1">
                Your proposal has been submitted to the DAO for voting.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="btn btn-primary w-full"
        >
          Create Another Proposal
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-6 mb-8">
      <h2 className="text-2xl font-bold text-white mb-6">
        Create New Proposal
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-purple-200">
            Proposal Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formValues.title}
            onChange={handleChange}
            placeholder="Enter a title for your proposal..."
            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-purple-200">
            Proposal Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formValues.description}
            onChange={handleChange}
            placeholder="Describe the purpose and details of this proposal..."
            rows={4}
            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="deadline" className="block text-sm font-medium text-purple-200">
            Voting Deadline
          </label>
          <input
            id="deadline"
            name="deadline"
            type="datetime-local"
            value={formValues.deadline ? new Date(formValues.deadline * 1000).toISOString().slice(0, 16) : ''}
            onChange={handleDateChange}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
          <p className="text-sm text-slate-400">
            The date when voting will end for this proposal
          </p>
        </div>

        {!isConnected && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-400 text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              Connect your wallet to create a proposal
            </p>
          </div>
        )}

        {uiError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {uiError}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || !isConnected}
          className="btn btn-primary w-full"
        >
          {isPending ? 'Creating...' : 'Create Proposal'}
        </button>
      </form>
    </div>
  );
}