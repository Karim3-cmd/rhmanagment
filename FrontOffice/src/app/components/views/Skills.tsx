import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Edit, Trash2, X, Link as LinkIcon, Unlink, Star } from 'lucide-react';
import { employeesApi, skillsApi, authApi } from '../../lib/api';
import type { Employee, Skill, User, UserRole } from '../../lib/types';

interface SkillsProps { userRole: UserRole; }

const emptySkill: Partial<Skill> = { name: '', description: '' };

export function Skills({ userRole }: SkillsProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [skillForm, setSkillForm] = useState<Partial<Skill>>(emptySkill);
  const [assignEmployeeId, setAssignEmployeeId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    const [skillsData, employeesData, usersData] = await Promise.all([skillsApi.list(), employeesApi.list(), authApi.listUsers()]);
    setSkills(skillsData.items);
    setEmployees(employeesData.items);
    setUsers(usersData.items);
  };

  useEffect(() => { loadData().catch(console.error); }, []);

  const filteredSkills = useMemo(() => skills.filter((skill) => {
    const q = searchTerm.toLowerCase();
    return !q || skill.name.toLowerCase().includes(q) || (skill.description || '').toLowerCase().includes(q);
  }), [skills, searchTerm]);

  // Filter to show only employees (not managers/HR) in the assign dropdown
  const employeesToAssign = useMemo(() => {
    const userRoleMap = new Map<string, UserRole>();
    users.forEach(user => {
      userRoleMap.set(user.email.toLowerCase(), user.role);
    });
    return employees.filter(emp => {
      const role = userRoleMap.get(emp.email.toLowerCase());
      return role === 'Employee';
    });
  }, [employees, users]);

  const openCreate = () => { setEditingSkill(null); setSkillForm(emptySkill); setShowSkillModal(true); setError(''); };
  const openEdit = (skill: Skill) => { setEditingSkill(skill); setSkillForm({ name: skill.name, description: skill.description }); setShowSkillModal(true); setError(''); };

  const saveSkill = async () => {
    try {
      if (editingSkill) await skillsApi.update(editingSkill._id, skillForm);
      else await skillsApi.create(skillForm);
      setShowSkillModal(false);
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not save skill');
    }
  };

  const deleteSkill = async (skill: Skill) => {
    if (!window.confirm(`Delete ${skill.name}?`)) return;
    await skillsApi.remove(skill._id);
    await loadData();
  };

  const submitAssignment = async () => {
    if (!showAssignModal || !assignEmployeeId) return;
    await skillsApi.assign(showAssignModal, { employeeId: assignEmployeeId, notes: assignNotes });
    setShowAssignModal(null);
    setAssignEmployeeId('');
    setAssignNotes('');
    await loadData();
  };

  const removeAssignment = async (skillId: string, employeeId: string) => {
    await skillsApi.unassign(skillId, employeeId);
    await loadData();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2 text-gray-900">Skills Catalog</h1>
          <p className="text-muted-foreground">Manage skills and assignments.</p>
        </div>
        {userRole === 'HR' && (
          <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="w-5 h-5" />Add Skill
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredSkills.length} of {skills.length} skills
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSkills.map((skill) => (
          <div key={skill._id} className="bg-white rounded-lg shadow-sm p-6 border border-border hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">{skill.name}</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {skill.description || 'No description'}
                </p>
              </div>
              {userRole === 'HR' && (
                <div className="flex gap-1">
                  <button onClick={() => setShowAssignModal(skill._id)} className="p-1.5 hover:bg-secondary rounded transition-colors" title="Assign">
                    <LinkIcon className="w-4 h-4 text-primary" />
                  </button>
                  <button onClick={() => openEdit(skill)} className="p-1.5 hover:bg-secondary rounded transition-colors">
                    <Edit className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => deleteSkill(skill)} className="p-1.5 hover:bg-secondary rounded transition-colors">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Employees</span>
                <span className="text-sm font-medium text-gray-900">{skill.employeeCount || 0}</span>
              </div>
              {skill.assignments?.length ? (
                <div className="pt-3 border-t border-border space-y-2">
                  {skill.assignments.map((assignment) => (
                    <div key={assignment.employeeId} className="flex items-center justify-between gap-3 text-sm">
                      <div>
                        <div className="font-medium text-gray-900">{assignment.employeeName}</div>
                      </div>
                      {userRole === 'HR' && (
                        <button onClick={() => removeAssignment(skill._id, assignment.employeeId)} className="p-1 rounded hover:bg-secondary" title="Remove">
                          <Unlink className="w-4 h-4 text-destructive" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground pt-3">No employees assigned.</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showSkillModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-gray-900">
                {editingSkill ? 'Edit Skill' : 'Add Skill'}
              </h2>
              <button onClick={() => setShowSkillModal(false)} className="p-2 hover:bg-secondary rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-gray-700">Skill Name *</label>
                <input
                  value={skillForm.name || ''}
                  onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., React"
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-gray-700">Description</label>
                <textarea
                  value={skillForm.description || ''}
                  onChange={(e) => setSkillForm({ ...skillForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-24"
                  placeholder="Skill description..."
                />
              </div>
              {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowSkillModal(false)} className="px-4 py-2 rounded-lg border border-input">Cancel</button>
                <button onClick={saveSkill} className="bg-primary text-white px-4 py-2 rounded-lg">
                  {editingSkill ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-gray-900">Assign Skill</h2>
              <button onClick={() => setShowAssignModal(null)} className="p-2 hover:bg-secondary rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-gray-700">Employee</label>
                <select
                  value={assignEmployeeId}
                  onChange={(e) => setAssignEmployeeId(e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select employee</option>
                  {employeesToAssign.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.fullName} ({emp.department || 'No department'})
                    </option>
                  ))}
                </select>
                {employeesToAssign.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">No employees available.</p>
                )}
              </div>
              <div>
                <label className="block text-sm mb-2 text-gray-700">Notes</label>
                <textarea
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-24"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowAssignModal(null)} className="px-4 py-2 rounded-lg border border-input">Cancel</button>
                <button onClick={submitAssignment} className="bg-primary text-white px-4 py-2 rounded-lg">Assign</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
