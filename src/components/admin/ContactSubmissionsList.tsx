'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { ContactSubmission } from '../../lib/validations/contact';

// Contact submission status configuration
const STATUS_CONFIG = {
  new: {
    label: 'New',
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    icon: ExclamationTriangleIcon,
    priority: 1
  },
  read: {
    label: 'Read',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    icon: EyeIcon,
    priority: 2
  },
  responded: {
    label: 'Responded',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    icon: CheckCircleIcon,
    priority: 3
  },
  closed: {
    label: 'Closed',
    color: 'bg-gray-500',
    textColor: 'text-gray-700',
    bgColor: 'bg-gray-50',
    icon: CheckCircleIcon,
    priority: 4
  }
};

// Contact stats interface
interface ContactStats {
  total_submissions: number;
  new_submissions: number;
  read_submissions: number;
  responded_submissions: number;
  closed_submissions: number;
  submissions_24h: number;
  submissions_7d: number;
  avg_response_time_hours: number;
}

// Main component props
interface ContactSubmissionsListProps {
  className?: string;
}

// Main contact submissions list component
const ContactSubmissionsList: React.FC<ContactSubmissionsListProps> = ({ className = '' }) => {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [stats, setStats] = useState<ContactStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | ContactSubmission['status']>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Observable Implementation - Component tracking
  useEffect(() => {
    console.log('CONTACT_ADMIN_COMPONENT_MOUNTED', {
      timestamp: new Date().toISOString(),
      component: 'ContactSubmissionsList'
    });
  }, []);

  // Fetch submissions and stats
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get admin token
      const adminToken = localStorage.getItem('admin_token');
      if (!adminToken) {
        throw new Error('Admin authentication required');
      }

      // Fetch submissions and stats
      const [submissionsResponse, statsResponse] = await Promise.all([
        fetch('/api/v1/contact/admin/submissions?limit=100', {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        }),
        fetch('/api/v1/contact/admin/stats', {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        })
      ]);

      if (!submissionsResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch contact data');
      }

      const submissionsData = await submissionsResponse.json();
      const statsData = await statsResponse.json();

      setSubmissions(submissionsData.data || []);
      setStats(statsData.data || null);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load contact data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle status update
  const handleStatusUpdate = async (id: string, status: ContactSubmission['status']) => {
    try {
      const adminToken = localStorage.getItem('admin_token');
      const response = await fetch(`/api/v1/contact/admin/submissions/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Failed to update status');

      setSubmissions(prev => 
        prev.map(sub => sub.id === id ? { ...sub, status } : sub)
      );
      fetchData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter(submission => {
    const matchesFilter = filter === 'all' || submission.status === filter;
    const matchesSearch = searchTerm === '' || 
      submission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="loader mr-3"></div>
          <span className="text-gray-600">Loading contact submissions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">Error Loading Contact Data</h3>
              <p className="text-red-700">{error}</p>
              <button onClick={fetchData} className="mt-3 button button-card button-small">
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white uppercase tracking-wide mb-2">
          Contact Management
        </h1>
        <p className="text-white opacity-75">
          Manage customer inquiries and contact form submissions
        </p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_submissions}</p>
              </div>
              <ChartBarIcon className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">New Messages</p>
                <p className="text-2xl font-bold text-blue-600">{stats.new_submissions}</p>
              </div>
              <ExclamationTriangleIcon className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Last 24 Hours</p>
                <p className="text-2xl font-bold text-green-600">{stats.submissions_24h}</p>
              </div>
              <ClockIcon className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.avg_response_time_hours ? `${Math.round(stats.avg_response_time_hours)}h` : 'N/A'}
                </p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                filter === 'all' ? 'bg-primary-bg text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({submissions.length})
            </button>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <button
                key={status}
                onClick={() => setFilter(status as ContactSubmission['status'])}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filter === status ? 'bg-primary-bg text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {config.label} ({submissions.filter(s => s.status === status).length})
              </button>
            ))}
          </div>

          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search submissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-bg focus:border-primary-bg"
            />
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredSubmissions.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <EnvelopeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Submissions Found</h3>
              <p className="text-gray-600">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your filters or search terms.' 
                  : 'No contact submissions have been received yet.'}
              </p>
            </div>
          ) : (
            filteredSubmissions.map((submission) => {
              const statusConfig = STATUS_CONFIG[submission.status];
              const StatusIcon = statusConfig.icon;
              const createdDate = new Date(submission.created_at || '').toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
              const messagePreview = submission.message.length > 100 
                ? submission.message.substring(0, 100) + '...'
                : submission.message;

              return (
                <motion.div
                  key={submission.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200 ${
                    submission.status === 'new' ? 'border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{submission.name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color} text-white`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <EnvelopeIcon className="w-4 h-4" />
                          <span>{submission.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <PhoneIcon className="w-4 h-4" />
                          <span>{submission.phone}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>{createdDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {submission.subject && (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700">Subject: </span>
                      <span className="text-sm text-gray-900">{submission.subject}</span>
                    </div>
                  )}

                  <div className="mb-4">
                    <p className="text-sm text-gray-700 leading-relaxed">{messagePreview}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Quick Actions:</span>
                    {submission.status === 'new' && (
                      <button
                        onClick={() => handleStatusUpdate(submission.id!, 'read')}
                        className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                      >
                        Mark as Read
                      </button>
                    )}
                    {(submission.status === 'new' || submission.status === 'read') && (
                      <button
                        onClick={() => handleStatusUpdate(submission.id!, 'responded')}
                        className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      >
                        Mark as Responded
                      </button>
                    )}
                    {submission.status !== 'closed' && (
                      <button
                        onClick={() => handleStatusUpdate(submission.id!, 'closed')}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ContactSubmissionsList; 