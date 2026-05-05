import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, User as UserIcon, Building2, Calendar, Loader2 } from 'lucide-react';
import { activitiesApi } from '../../lib/api';
import type { User } from '../../lib/types';

interface PendingApproval {
  activityId: string;
  activityTitle: string;
  employeeId: string;
  employeeName: string;
  employeeDepartment: string;
  enrolledAt: string;
  notes: string;
}

interface ManagerApprovalsProps {
  user: User;
}

export function ManagerApprovals({ user }: ManagerApprovalsProps) {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);

  useEffect(() => {
    loadPendingApprovals();
  }, [user._id]);

  const loadPendingApprovals = async () => {
    console.log('[DEBUG Frontend] User:', user);
    console.log('[DEBUG Frontend] User._id:', user._id);
    try {
      setLoading(true);
      const response = await activitiesApi.getPendingApprovals(user._id);
      setPendingApprovals(response.items);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approval: PendingApproval) => {
    setProcessing(`${approval.activityId}-${approval.employeeId}`);
    setError('');
    try {
      await activitiesApi.approveEnrollment(
        approval.activityId,
        approval.employeeId,
        user.name,
        reviewNote || undefined
      );
      await loadPendingApprovals();
      setSelectedApproval(null);
      setReviewNote('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to approve enrollment');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (approval: PendingApproval) => {
    setProcessing(`${approval.activityId}-${approval.employeeId}`);
    setError('');
    try {
      await activitiesApi.rejectEnrollment(
        approval.activityId,
        approval.employeeId,
        user.name,
        reviewNote || undefined
      );
      await loadPendingApprovals();
      setSelectedApproval(null);
      setReviewNote('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to reject enrollment');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2 text-gray-900">Pending Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve activity assignments for employees in your department.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-lg">
          <Clock className="w-5 h-5 text-yellow-600" />
          <span className="font-medium text-yellow-700">
            {pendingApprovals.length} pending
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {pendingApprovals.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 border border-border text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pending approvals</h3>
          <p className="text-muted-foreground">
            All activity assignments in your department have been reviewed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingApprovals.map((approval) => (
            <div
              key={`${approval.activityId}-${approval.employeeId}`}
              className="bg-white rounded-lg shadow-sm border border-border p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {approval.employeeName}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="w-4 h-4" />
                        {approval.employeeDepartment}
                      </div>
                    </div>
                  </div>

                  <div className="ml-13 pl-13">
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Activity:</span> {approval.activityTitle}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Assigned on {formatDate(approval.enrolledAt)}
                      </span>
                    </div>
                    {approval.notes && (
                      <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <span className="font-medium">HR Notes:</span> {approval.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  {selectedApproval?.activityId === approval.activityId &&
                  selectedApproval?.employeeId === approval.employeeId ? (
                    <div className="space-y-2">
                      <textarea
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        placeholder="Add review note (optional)..."
                        className="w-48 px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(approval)}
                          disabled={processing === `${approval.activityId}-${approval.employeeId}`}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {processing === `${approval.activityId}-${approval.employeeId}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Confirm
                        </button>
                        <button
                          onClick={() => handleReject(approval)}
                          disabled={processing === `${approval.activityId}-${approval.employeeId}`}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {processing === `${approval.activityId}-${approval.employeeId}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            setSelectedApproval(null);
                            setReviewNote('');
                          }}
                          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedApproval(approval);
                          setReviewNote('');
                        }}
                        className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedApproval(approval);
                          setReviewNote('');
                        }}
                        className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
