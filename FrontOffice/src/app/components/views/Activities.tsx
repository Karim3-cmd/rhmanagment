import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Edit, FileCheck, Plus, Search, Target, Trash2, Upload, Users, X, CheckCircle, Clock, AlertCircle, Sparkles, Star, Loader2 } from 'lucide-react';
import { activitiesApi, employeesApi, skillsApi, aiApi } from '../../lib/api';
import type { Activity, Employee, Skill, User, UserRole, ActivityProof } from '../../lib/types';

interface ActivitiesProps {
  userRole: UserRole;
  user: User;
}

const emptyForm: Partial<Activity> = {
  title: '',
  description: '',
  context: 'Upskilling',
  seats: 10,
  status: 'Draft',
  startDate: new Date().toISOString().split('T')[0], // Today
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 days
  requiredSkills: [],
};

export function Activities({ userRole, user }: ActivitiesProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [form, setForm] = useState<Partial<Activity>>(emptyForm);
  const [showEnrollModal, setShowEnrollModal] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [enrollNotes, setEnrollNotes] = useState('');
  const [error, setError] = useState('');
  const [showProofModal, setShowProofModal] = useState<{ activityId: string; employeeId: string } | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<{ activity: Activity; enrollment: any; proofIndex: number } | null>(null);
  const [proofForm, setProofForm] = useState({ title: '', type: 'Certificate', url: '', note: '' });
  const [reviewForm, setReviewForm] = useState({ decision: 'approved' as 'approved' | 'rejected', reviewNote: '', progressWeight: 25 });
  const [showAIModal, setShowAIModal] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState<Array<{ employeeId: string; employeeName: string; department: string; score: number; matchedSkills: Array<{ skill: string; rating: number }>; missingSkills: string[]; isFromOtherDepartment: boolean; yearsOfExperience?: number; explanation?: string }>>([]);
  const [aiExtractedSkills, setAiExtractedSkills] = useState<string[]>([]);
  // AI recommendations for Add Activity modal
  const [createAiLoading, setCreateAiLoading] = useState(false);
  const [createAiResults, setCreateAiResults] = useState<Array<{ employeeId: string; employeeName: string; department: string; score: number; matchedSkills: Array<{ skill: string; rating: number }>; missingSkills: string[]; isFromOtherDepartment: boolean; yearsOfExperience?: number; explanation?: string }>>([]);
  const [createAiExtractedSkills, setCreateAiExtractedSkills] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const aiDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const proofTypes = ['Certificate', 'Course', 'Project', 'Evaluation', 'Document', 'Other'];

  const loadData = async () => {
    const [activityData, employeeData, skillData] = await Promise.all([
      activitiesApi.list(),
      employeesApi.list(),
      skillsApi.list(),
    ]);
    setActivities(activityData.items);
    setEmployees(employeeData.items);
    setSkills(skillData.items);
  };

  useEffect(() => {
    loadData().catch(console.error);
  }, []);

  const filteredActivities = useMemo(() => {
    let list = activities;
    if (userRole === 'Employee') {
      const matchedEmployee = employees.find((e) => e.email === user.email);
      if (matchedEmployee) {
        list = list.filter((activity) => activity.enrollments?.some((item) => item.employeeId === matchedEmployee._id));
      } else {
        list = [];
      }
    }
    return list.filter(
      (activity) =>
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (activity.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activities, employees, user.email, userRole, searchTerm]);

  const openCreate = () => {
    setEditingActivity(null);
    setForm({ ...emptyForm });
    setError('');
    setCreateAiResults([]);
    setCreateAiExtractedSkills([]);
    setSelectedEmployees([]);
    setShowModal(true);
  };

  const openEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setForm({ ...activity, requiredSkills: activity.requiredSkills || [] });
    setError('');
    setShowModal(true);
  };

  const saveActivity = async () => {
    try {
      if (editingActivity) {
        await activitiesApi.update(editingActivity._id, form);
        setShowModal(false);
        await loadData();
      } else {
        const created = await activitiesApi.create(form);
        // Assign selected employees
        for (const employeeId of selectedEmployees) {
          try {
            await activitiesApi.assign(created._id, {
              employeeId,
              notes: `AI-recommended based on skill match`,
            });
          } catch (assignErr) {
            console.error(`Failed to assign ${employeeId}:`, assignErr);
          }
        }
        setShowModal(false);
        setSelectedEmployees([]);
        setCreateAiResults([]);
        setCreateAiExtractedSkills([]);
        await loadData();
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not save activity');
    }
  };

  const deleteActivity = async (activity: Activity) => {
    if (!window.confirm(`Delete ${activity.title}?`)) return;
    await activitiesApi.remove(activity._id);
    await loadData();
  };

  const enroll = async () => {
    if (!showEnrollModal || !selectedEmployeeId) return;
    try {
      if (userRole === 'HR') {
        await activitiesApi.assign(showEnrollModal, {
          employeeId: selectedEmployeeId,
          notes: enrollNotes,
        });
      } else {
        await activitiesApi.enroll(showEnrollModal, {
          employeeId: selectedEmployeeId,
          notes: enrollNotes,
        });
      }
      setShowEnrollModal(null);
      setSelectedEmployeeId('');
      setEnrollNotes('');
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not enroll employee');
    }
  };

  const removeEnrollment = async (activityId: string, employeeId: string) => {
    await activitiesApi.unenroll(activityId, employeeId);
    await loadData();
  };

  const submitProof = async () => {
    if (!showProofModal) return;
    try {
      await activitiesApi.submitProof(showProofModal.activityId, showProofModal.employeeId, proofForm);
      setShowProofModal(null);
      setProofForm({ title: '', type: 'Certificate', url: '', note: '' });
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not submit proof');
    }
  };

  const reviewProof = async () => {
    if (!showReviewModal) return;
    try {
      const matchedEmployee = employees.find((e) => e.email === user.email);
      await activitiesApi.reviewProof(
        showReviewModal.activity._id,
        showReviewModal.enrollment.employeeId,
        showReviewModal.proofIndex,
        {
          ...reviewForm,
          reviewedBy: matchedEmployee?.fullName || user.name,
        }
      );
      setShowReviewModal(null);
      setReviewForm({ decision: 'approved', reviewNote: '', progressWeight: 25 });
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not review proof');
    }
  };

  const getMyEmployeeId = () => {
    const matched = employees.find((e) => e.email === user.email);
    return matched?._id || '';
  };

  const openAIModal = async (activity: Activity) => {
    setShowAIModal(activity._id);
    setAiLoading(true);
    setError('');
    setAiResults([]);
    setAiExtractedSkills([]);
    try {
      // Pass the manager's department to prioritize employees from same department
      const data = await aiApi.recommendEmployees(activity.description || activity.title, user.department);
      if (data.success) {
        setAiResults(data.recommendations);
        setAiExtractedSkills(data.extractedSkills);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'AI recommendation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const closeAIModal = () => {
    setShowAIModal(null);
    setAiResults([]);
    setAiExtractedSkills([]);
  };

  // Fetch AI recommendations when description changes in Create modal
  const fetchCreateAiRecommendations = async (description: string) => {
    if (!description || description.length < 5) {
      setCreateAiResults([]);
      setCreateAiExtractedSkills([]);
      return;
    }
    setCreateAiLoading(true);
    try {
      const data = await aiApi.recommendEmployees(description, user.department);
      if (data.success) {
        setCreateAiResults(data.recommendations);
        setCreateAiExtractedSkills(data.extractedSkills);
      }
    } catch (err: any) {
      // Silently fail - AI is optional
    } finally {
      setCreateAiLoading(false);
    }
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const assignFromAI = async (activityId: string, employeeId: string) => {
    try {
      if (userRole === 'HR') {
        await activitiesApi.assign(activityId, {
          employeeId,
          notes: `AI-recommended based on skill match`,
        });
      } else {
        await activitiesApi.enroll(activityId, {
          employeeId,
          notes: `AI-recommended based on skill match`,
        });
      }
      closeAIModal();
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not assign employee');
    }
  };

  const addRequiredSkill = () => {
    setForm({
      ...form,
      requiredSkills: [...(form.requiredSkills || []), { name: '', level: 2 }],
    });
  };

  const updateRequiredSkill = (index: number, key: 'name' | 'level', value: string | number) => {
    const next = [...(form.requiredSkills || [])];
    next[index] = { ...next[index], [key]: value };
    setForm({ ...form, requiredSkills: next });
  };

  const removeRequiredSkill = (index: number) => {
    const next = [...(form.requiredSkills || [])];
    next.splice(index, 1);
    setForm({ ...form, requiredSkills: next });
  };

  const availableEmployees = employees.filter((employee) => !activities.find((activity) => activity._id === showEnrollModal)?.enrollments?.some((item) => item.employeeId === employee._id));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2 text-gray-900">Activities</h1>
          <p className="text-muted-foreground">Training programs are now live backend records with enrollments.</p>
        </div>
        {(userRole === 'HR' || userRole === 'Manager') && (
          <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"><Plus className="w-5 h-5" />Create Activity</button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input type="text" placeholder="Search activities..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="mt-4 text-sm text-muted-foreground">Showing {filteredActivities.length} of {activities.length} activities</div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredActivities.map((activity) => (
          <div key={activity._id} className="bg-white rounded-lg shadow-sm p-6 border border-border">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{activity.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{activity.description || 'No description'}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700">{activity.context}</span>
                  <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700">{activity.status}</span>
                </div>
              </div>
              {(userRole === 'HR' || userRole === 'Manager') && (
                <div className="flex gap-2">
                  <button onClick={() => setShowEnrollModal(activity._id)} className="p-2 hover:bg-secondary rounded-lg" title="Enroll"><Users className="w-4 h-4 text-primary" /></button>
                  <button onClick={() => openAIModal(activity)} className="p-2 hover:bg-secondary rounded-lg" title="AI Recommendations"><Sparkles className="w-4 h-4 text-purple-500" /></button>
                  <button onClick={() => openEdit(activity)} className="p-2 hover:bg-secondary rounded-lg"><Edit className="w-4 h-4 text-muted-foreground" /></button>
                  <button onClick={() => deleteActivity(activity)} className="p-2 hover:bg-secondary rounded-lg"><Trash2 className="w-4 h-4 text-destructive" /></button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-4 h-4" />{activity.startDate || 'TBD'} → {activity.endDate || 'TBD'}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Users className="w-4 h-4" />{activity.enrolled || 0}/{activity.seats} enrolled</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Target className="w-4 h-4" />{(activity.requiredSkills || []).length} required skills</div>
            </div>
            {!!activity.requiredSkills?.length && (
              <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
                {activity.requiredSkills.map((skill, index) => (
                  <span key={`${activity._id}-${index}`} className="px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-700">{skill.name} · L{skill.level}</span>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              <p className="text-sm font-medium text-gray-900">Enrolled employees</p>
              {activity.enrollments?.length ? activity.enrollments.map((enrollment) => (
                <div key={enrollment.employeeId} className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{enrollment.employeeName}</div>
                      <div className="text-sm text-muted-foreground">{enrollment.notes || 'No note'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${enrollment.status === 'Completed' ? 'bg-green-100 text-green-700' : enrollment.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {enrollment.status}
                      </span>
                      {(userRole === 'HR' || userRole === 'Manager') && (
                        <button onClick={() => removeEnrollment(activity._id, enrollment.employeeId)} className="text-destructive hover:underline text-sm">Remove</button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{enrollment.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${enrollment.progress || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Proofs List */}
                  {enrollment.proofs && enrollment.proofs.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Submitted Proofs</p>
                      <div className="space-y-2">
                        {enrollment.proofs.map((proof: ActivityProof, idx: number) => (
                          <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border text-sm">
                            <div className="flex items-center gap-2">
                              {proof.status === 'approved' && <CheckCircle className="w-4 h-4 text-green-500" />}
                              {proof.status === 'pending' && <Clock className="w-4 h-4 text-yellow-500" />}
                              {proof.status === 'rejected' && <AlertCircle className="w-4 h-4 text-red-500" />}
                              <span className="font-medium">{proof.title}</span>
                              <span className="text-xs text-gray-500">({proof.type})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded ${proof.status === 'approved' ? 'bg-green-100 text-green-700' : proof.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                {proof.status}
                              </span>
                              {(userRole === 'HR' || userRole === 'Manager') && proof.status === 'pending' && (
                                <button
                                  onClick={() => setShowReviewModal({ activity, enrollment, proofIndex: idx })}
                                  className="text-primary hover:underline text-xs"
                                >
                                  Review
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submit Proof Button - Only for Employee */}
                  {userRole === 'Employee' && getMyEmployeeId() === enrollment.employeeId && (enrollment.progress || 0) < 100 && (
                    <button
                      onClick={() => setShowProofModal({ activityId: activity._id, employeeId: enrollment.employeeId })}
                      className="flex items-center gap-2 text-primary hover:underline text-sm"
                    >
                      <Upload className="w-4 h-4" />
                      Submit Proof
                    </button>
                  )}
                </div>
              )) : <div className="text-sm text-muted-foreground">No enrollments yet.</div>}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-gray-900">{editingActivity ? 'Edit Activity' : 'Create Activity'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            {/* Simple Form - Only Title and Description */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-gray-700">Title</label>
                <input
                  value={form.title || ''}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg"
                  placeholder="Enter activity title"
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-gray-700">Description</label>
                <textarea
                  value={form.description || ''}
                  onChange={(e) => {
                    const newDesc = e.target.value;
                    setForm({ ...form, description: newDesc });
                    // Auto-fetch AI recommendations when description changes (debounced)
                    if (!editingActivity && newDesc.length > 10) {
                      if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current);
                      aiDebounceRef.current = setTimeout(() => fetchCreateAiRecommendations(newDesc), 500);
                    }
                  }}
                  className="w-full px-4 py-2 border border-input rounded-lg min-h-32"
                  placeholder="Describe the activity... AI will recommend employees based on this description"
                />
              </div>
            </div>

            {/* AI Recommendations Section - Only for Create mode */}
            {!editingActivity && (
              <div className="mt-6 border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <h3 className="font-semibold text-gray-900">AI Recommendations</h3>
                </div>

                {/* Extracted Skills */}
                {createAiExtractedSkills.length > 0 && (
                  <div className="bg-purple-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-purple-900 mb-2">Skills detected:</p>
                    <div className="flex flex-wrap gap-2">
                      {createAiExtractedSkills.map((skill, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Loading */}
                {createAiLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">AI analyzing...</span>
                  </div>
                )}

                {/* Recommendations */}
                {!createAiLoading && createAiResults.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">{createAiResults.length} employee{createAiResults.length > 1 ? 's' : ''} recommended:</p>
                    {createAiResults.slice(0, 5).map((result) => (
                      <div
                        key={result.employeeId}
                        onClick={() => toggleEmployeeSelection(result.employeeId)}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${selectedEmployees.includes(result.employeeId)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedEmployees.includes(result.employeeId)
                              ? 'border-primary bg-primary'
                              : 'border-gray-300'
                              }`}>
                              {selectedEmployees.includes(result.employeeId) && <CheckCircle className="w-3 h-3 text-white" />}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{result.employeeName}</h4>
                              <p className="text-xs text-gray-500">{result.department}{result.yearsOfExperience !== undefined ? ` · ${result.yearsOfExperience} years exp.` : ''}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${star <= Math.round(result.score / 20) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium text-primary">{result.score}% match</span>
                          </div>
                        </div>
                        {result.matchedSkills.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {result.matchedSkills.map((ms, i) => (
                              <span key={i} className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">{ms.skill} ★{ms.rating}</span>
                            ))}
                          </div>
                        )}
                        {result.explanation && (
                          <div className="mt-3 text-xs italic text-gray-700 bg-purple-50 p-2 rounded border-l-2 border-purple-400">
                            <strong>AI Reasoning:</strong> {result.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!createAiLoading && form.description && form.description.length > 10 && createAiResults.length === 0 && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No matching employees found for this description.
                  </div>
                )}
              </div>
            )}

            {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-input">Cancel</button>
              <button
                onClick={saveActivity}
                disabled={!form.title || !form.description}
                className="bg-primary text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {editingActivity ? 'Update Activity' : `Create & Assign (${selectedEmployees.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6"><h2 className="text-2xl text-gray-900">Enroll Employee</h2><button onClick={() => setShowEnrollModal(null)} className="p-2 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button></div>
            <div className="space-y-4">
              <div><label className="block text-sm mb-2 text-gray-700">Employee</label><select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)} className="w-full px-4 py-2 border border-input rounded-lg"><option value="">Select employee</option>{availableEmployees.map((employee) => <option key={employee._id} value={employee._id}>{employee.fullName}</option>)}</select></div>
              <div><label className="block text-sm mb-2 text-gray-700">Notes</label><textarea value={enrollNotes} onChange={(e) => setEnrollNotes(e.target.value)} className="w-full px-4 py-2 border border-input rounded-lg min-h-24" /></div>
              {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              <div className="flex justify-end gap-3"><button onClick={() => setShowEnrollModal(null)} className="px-4 py-2 rounded-lg border border-input">Cancel</button><button onClick={enroll} className="bg-primary text-white px-4 py-2 rounded-lg">Enroll</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Proof Modal */}
      {showProofModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-gray-900">Submit Proof</h2>
              <button onClick={() => setShowProofModal(null)} className="p-2 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-gray-700">Title</label>
                <input
                  value={proofForm.title}
                  onChange={(e) => setProofForm({ ...proofForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg"
                  placeholder="e.g., AWS Certification - Module 1"
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-gray-700">Type</label>
                <select
                  value={proofForm.type}
                  onChange={(e) => setProofForm({ ...proofForm, type: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg"
                >
                  {proofTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2 text-gray-700">URL / Link</label>
                <input
                  value={proofForm.url}
                  onChange={(e) => setProofForm({ ...proofForm, url: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-gray-700">Notes</label>
                <textarea
                  value={proofForm.note}
                  onChange={(e) => setProofForm({ ...proofForm, note: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg min-h-24"
                  placeholder="Describe what you accomplished..."
                />
              </div>
              {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowProofModal(null)} className="px-4 py-2 rounded-lg border border-input">Cancel</button>
                <button onClick={submitProof} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Proof Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-gray-900">Review Proof</h2>
              <button onClick={() => setShowReviewModal(null)} className="p-2 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">{showReviewModal.enrollment.proofs[showReviewModal.proofIndex].title}</p>
                <p className="text-sm text-gray-500">Type: {showReviewModal.enrollment.proofs[showReviewModal.proofIndex].type}</p>
                {showReviewModal.enrollment.proofs[showReviewModal.proofIndex].url && (
                  <a href={showReviewModal.enrollment.proofs[showReviewModal.proofIndex].url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">View Link</a>
                )}
                <p className="text-sm text-gray-600 mt-2">{showReviewModal.enrollment.proofs[showReviewModal.proofIndex].note}</p>
              </div>
              <div>
                <label className="block text-sm mb-2 text-gray-700">Decision</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setReviewForm({ ...reviewForm, decision: 'approved' })}
                    className={`flex-1 px-4 py-2 rounded-lg border ${reviewForm.decision === 'approved' ? 'bg-green-100 border-green-500 text-green-700' : 'border-input'}`}
                  >
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => setReviewForm({ ...reviewForm, decision: 'rejected' })}
                    className={`flex-1 px-4 py-2 rounded-lg border ${reviewForm.decision === 'rejected' ? 'bg-red-100 border-red-500 text-red-700' : 'border-input'}`}
                  >
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    Reject
                  </button>
                </div>
              </div>
              {reviewForm.decision === 'approved' && (
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Progress Weight (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={reviewForm.progressWeight}
                    onChange={(e) => setReviewForm({ ...reviewForm, progressWeight: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-input rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">How much this proof contributes to overall progress</p>
                </div>
              )}
              <div>
                <label className="block text-sm mb-2 text-gray-700">Review Notes</label>
                <textarea
                  value={reviewForm.reviewNote}
                  onChange={(e) => setReviewForm({ ...reviewForm, reviewNote: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg min-h-24"
                  placeholder="Add feedback for the employee..."
                />
              </div>
              {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowReviewModal(null)} className="px-4 py-2 rounded-lg border border-input">Cancel</button>
                <button onClick={reviewProof} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  {reviewForm.decision === 'approved' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Recommendations Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-500" />
                AI Employee Recommendations
              </h2>
              <button onClick={closeAIModal} className="p-2 hover:bg-secondary rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {aiExtractedSkills.length > 0 && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-purple-900 mb-2">Extracted Skills from Description:</p>
                  <div className="flex flex-wrap gap-2">
                    {aiExtractedSkills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {aiLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">AI is analyzing skills and finding best matches...</p>
                  </div>
                </div>
              ) : (
                <div>
                  {aiResults.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-700">
                        Found {aiResults.length} matching employee{aiResults.length > 1 ? 's' : ''} in your department
                      </p>
                      {aiResults.map((result) => {
                        const employee = employees.find((e) => e._id === result.employeeId);
                        const isAlreadyEnrolled = activities
                          .find((a) => a._id === showAIModal)
                          ?.enrollments?.some((e) => e.employeeId === result.employeeId);
                        return (
                          <div key={result.employeeId} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-gray-900">{result.employeeName}</h4>
                                <p className="text-xs text-gray-500">{result.department}{result.yearsOfExperience !== undefined ? ` · ${result.yearsOfExperience} years exp.` : ''}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-4 h-4 ${star <= Math.round(result.score / 20) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm font-medium text-gray-700">{result.score}% match</span>
                                </div>
                              </div>
                              {!isAlreadyEnrolled ? (
                                <button
                                  onClick={() => assignFromAI(showAIModal, result.employeeId)}
                                  className="px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                  Assign to Activity
                                </button>
                              ) : (
                                <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg">
                                  Already enrolled
                                </span>
                              )}
                            </div>

                            {result.matchedSkills && result.matchedSkills.length > 0 && (
                              <div className="mb-2">
                                <p className="text-xs text-gray-500 mb-1">Matched skills:</p>
                                <div className="flex flex-wrap gap-1">
                                  {result.matchedSkills.map((ms: any, i: number) => (
                                    <span key={i} className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                                      {ms.skill} (★{ms.rating})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {result.missingSkills && result.missingSkills.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Missing skills:</p>
                                <div className="flex flex-wrap gap-1">
                                  {result.missingSkills.map((ms: string, i: number) => (
                                    <span key={i} className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">{ms}</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {result.explanation && (
                              <div className="mt-3 text-sm italic text-gray-700 bg-purple-50 p-3 rounded-lg border-l-4 border-purple-400">
                                <strong>AI Reasoning:</strong> {result.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : !aiLoading && (
                    <div className="text-center py-8 text-muted-foreground">
                      No matching employees found in your department for the extracted skills.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
