"use client";

import { useState } from 'react';

/**
 * Props para el componente CreateProposal
 */
interface CreateProposalProps {
  onCreateProposal: (title: string, description: string, deadline: Date) => void;
  disabled?: boolean;
}

/**
 * Componente para crear una nueva propuesta en el DAO
 * Diseño responsive con Tailwind CSS
 */
export default function CreateProposal({ onCreateProposal, disabled = false }: CreateProposalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  /**
   * Valida los campos del formulario
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    if (!deadline) {
      newErrors.deadline = 'Deadline is required';
    } else {
      const deadlineDate = new Date(deadline);
      const minDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // Mínimo 24 horas desde ahora
      
      if (deadlineDate < minDeadline) {
        newErrors.deadline = 'Deadline must be at least 24 hours from now';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    try {
      await onCreateProposal(title, description, new Date(deadline));
      
      // Reiniciar el formulario
      setTitle('');
      setDescription('');
      setErrors({});
    } catch (error) {
      console.error('Error creating proposal:', error);
      setErrors({ form: 'Failed to create proposal. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Proposal</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={disabled || submitting}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                     focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-50 
                     disabled:cursor-not-allowed transition-colors duration-200"
            placeholder="Enter proposal title"
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={disabled || submitting}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                     focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-50 
                     disabled:cursor-not-allowed transition-colors duration-200 resize-vertical"
            placeholder="Describe your proposal in detail"
          ></textarea>
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>

        <div>
          <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
            Voting Deadline
          </label>
          <input
            type="date"
            id="deadline"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            disabled={disabled || submitting}
            min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                     focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-50 
                     disabled:cursor-not-allowed transition-colors duration-200"
          />
          {errors.deadline && <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>}
        </div>

        {errors.form && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{errors.form}</div>}

        <button
          type="submit"
          disabled={disabled || submitting}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 
                   hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6 
                   rounded-lg shadow-lg transform transition-all duration-200 
                   hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed 
                   disabled:transform-none flex items-center justify-center"
        >
          {submitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Proposal...
            </>
          ) : (
            <>Create Proposal</>
          )}
        </button>
      </form>
    </div>
  );
}