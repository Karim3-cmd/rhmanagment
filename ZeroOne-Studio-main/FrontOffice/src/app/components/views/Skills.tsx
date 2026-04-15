import { useEffect, useMemo, useState } from 'react';
import { Search, Filter, Plus, Edit, Trash2, TrendingUp, X, Link as LinkIcon, Unlink } from 'lucide-react';
import { employeesApi, skillsApi } from '../../lib/api';
import type { Employee, Skill, UserRole } from '../../lib/types';

interface SkillsProps { userRole: UserRole; }

const emptySkill: Partial<Skill> = { name: '', type: 'Know-How', category: '', description: '', trending: false };

export function Skills({ userRole }: SkillsProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [skillForm, setSkillForm] = useState<Partial<Skill>>(emptySkill);
  const [assignEmployeeId, setAssignEmployeeId] = useState('');
  const [assignLevel, setAssignLevel] = useState(3);
  const [assignNotes, setAssignNotes] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    const [skillsData, employeesData] = await Promise.all([skillsApi.list(), employeesApi.list()]);
    setSkills(skillsData.items);
    setEmployees(employeesData.items);
  };

  useEffect(() => { loadData().catch(console.error); }, []);

  const types = ['All', 'Knowledge', 'Know-How', 'Soft Skill'];
  const filteredSkills = useMemo(() => skills.filter((skill) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q || skill.name.toLowerCase().includes(q) || (skill.category || '').toLowerCase().includes(q) || (skill.description || '').toLowerCase().includes(q);
    const matchesType = selectedType === 'All' || skill.type === selectedType;
    return matchesSearch && matchesType;
  }), [skills, searchTerm, selectedType]);

  const openCreate = () => { setEditingSkill(null); setSkillForm(emptySkill); setShowSkillModal(true); setError(''); };
  const openEdit = (skill: Skill) => { setEditingSkill(skill); setSkillForm(skill); setShowSkillModal(true); setError(''); };

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
    await skillsApi.assign(showAssignModal, { employeeId: assignEmployeeId, level: assignLevel, notes: assignNotes });
    setShowAssignModal(null);
    setAssignEmployeeId('');
    setAssignNotes('');
    setAssignLevel(3);
    await loadData();
  };

  const removeAssignment = async (skillId: string, employeeId: string) => {
    await skillsApi.unassign(skillId, employeeId);
    await loadData();
  };

  const getTypeColor = (type: string) => type === 'Knowledge' ? 'bg-purple-100 text-purple-700' : type === 'Know-How' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700';
  const getLevelLabel = (level: number) => level >= 3.5 ? 'Expert' : level >= 2.5 ? 'Good' : level >= 1.5 ? 'Medium' : 'Low';
  const getLevelColor = (level: number) => level >= 3.5 ? 'text-green-600' : level >= 2.5 ? 'text-blue-600' : level >= 1.5 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-3xl mb-2 text-gray-900">Skills Catalog</h1><p className="text-muted-foreground">Live skills and assignments from the backend.</p></div>{userRole === 'HR' && <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"><Plus className="w-5 h-5" />Add Skill</button>}</div>
      <div className="bg-white rounded-lg shadow-sm p-6 border border-border"><div className="flex flex-col md:flex-row gap-4"><div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><input type="text" placeholder="Search skills by name or category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" /></div><div className="flex items-center gap-2"><Filter className="w-5 h-5 text-muted-foreground" /><select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">{types.map((type) => <option key={type} value={type}>{type}</option>)}</select></div></div><div className="mt-4 text-sm text-muted-foreground">Showing {filteredSkills.length} of {skills.length} skills</div></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{filteredSkills.map((skill) => <div key={skill._id} className="bg-white rounded-lg shadow-sm p-6 border border-border hover:shadow-md transition-shadow"><div className="flex items-start justify-between mb-4"><div className="flex-1"><div className="flex items-center gap-2 mb-2"><h3 className="font-semibold text-lg text-gray-900">{skill.name}</h3>{skill.trending && <TrendingUp className="w-4 h-4 text-green-600" title="Trending" />}</div><p className="text-sm text-muted-foreground mb-2">{skill.category}</p><p className="text-sm text-muted-foreground mb-3">{skill.description}</p><span className={`inline-block text-xs px-2 py-1 rounded-full ${getTypeColor(skill.type)}`}>{skill.type}</span></div>{userRole === 'HR' && <div className="flex gap-1"><button onClick={() => setShowAssignModal(skill._id)} className="p-1.5 hover:bg-secondary rounded transition-colors" title="Assign"><LinkIcon className="w-4 h-4 text-primary" /></button><button onClick={() => openEdit(skill)} className="p-1.5 hover:bg-secondary rounded transition-colors"><Edit className="w-4 h-4 text-muted-foreground" /></button><button onClick={() => deleteSkill(skill)} className="p-1.5 hover:bg-secondary rounded transition-colors"><Trash2 className="w-4 h-4 text-destructive" /></button></div>}</div><div className="space-y-3"><div><div className="flex items-center justify-between mb-2"><span className="text-sm text-muted-foreground">Average Level</span><span className={`text-sm font-medium ${getLevelColor(skill.averageLevel || 0)}`}>{getLevelLabel(skill.averageLevel || 0)} ({(skill.averageLevel || 0).toFixed(1)}/4)</span></div><div className="w-full bg-secondary rounded-full h-2"><div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${((skill.averageLevel || 0) / 4) * 100}%` }} /></div></div><div className="flex items-center justify-between pt-3 border-t border-border"><span className="text-sm text-muted-foreground">Employees</span><span className="text-sm font-medium text-gray-900">{skill.employeeCount || 0}</span></div>{skill.assignments?.length ? <div className="pt-3 border-t border-border space-y-2">{skill.assignments.map((assignment) => <div key={assignment.employeeId} className="flex items-center justify-between gap-3 text-sm"><div><div className="font-medium text-gray-900">{assignment.employeeName}</div><div className="text-muted-foreground">Level {assignment.level}/4</div></div>{userRole === 'HR' && <button onClick={() => removeAssignment(skill._id, assignment.employeeId)} className="p-1 rounded hover:bg-secondary" title="Remove assignment"><Unlink className="w-4 h-4 text-destructive" /></button>}</div>)}</div> : <div className="text-sm text-muted-foreground pt-3 border-t border-border">No assignments yet.</div>}</div></div>)}</div>
      {showSkillModal && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6"><div className="flex items-center justify-between mb-6"><h2 className="text-2xl text-gray-900">{editingSkill ? 'Edit Skill' : 'Add Skill'}</h2><button onClick={() => setShowSkillModal(false)} className="p-2 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button></div><div className="space-y-4"><div><label className="block text-sm mb-2 text-gray-700">Skill Name</label><input value={skillForm.name || ''} onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })} className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" /></div><div><label className="block text-sm mb-2 text-gray-700">Skill Type</label><select value={skillForm.type || 'Know-How'} onChange={(e) => setSkillForm({ ...skillForm, type: e.target.value as Skill['type'] })} className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"><option value="Knowledge">Knowledge</option><option value="Know-How">Know-How</option><option value="Soft Skill">Soft Skill</option></select></div><div><label className="block text-sm mb-2 text-gray-700">Category</label><input value={skillForm.category || ''} onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value })} className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" /></div><div><label className="block text-sm mb-2 text-gray-700">Description</label><textarea value={skillForm.description || ''} onChange={(e) => setSkillForm({ ...skillForm, description: e.target.value })} className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-24" /></div><label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={!!skillForm.trending} onChange={(e) => setSkillForm({ ...skillForm, trending: e.target.checked })} /> Trending skill</label>{error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}<div className="flex justify-end gap-3"><button onClick={() => setShowSkillModal(false)} className="px-4 py-2 rounded-lg border border-input">Cancel</button><button onClick={saveSkill} className="bg-primary text-white px-4 py-2 rounded-lg">{editingSkill ? 'Update Skill' : 'Create Skill'}</button></div></div></div></div>}
      {showAssignModal && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6"><div className="flex items-center justify-between mb-6"><h2 className="text-2xl text-gray-900">Assign Skill</h2><button onClick={() => setShowAssignModal(null)} className="p-2 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button></div><div className="space-y-4"><div><label className="block text-sm mb-2 text-gray-700">Employee</label><select value={assignEmployeeId} onChange={(e) => setAssignEmployeeId(e.target.value)} className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"><option value="">Select employee</option>{employees.map((employee) => <option key={employee._id} value={employee._id}>{employee.fullName}</option>)}</select></div><div><label className="block text-sm mb-2 text-gray-700">Level (1-4)</label><input type="number" min={1} max={4} value={assignLevel} onChange={(e) => setAssignLevel(Number(e.target.value))} className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" /></div><div><label className="block text-sm mb-2 text-gray-700">Notes</label><textarea value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)} className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-24" /></div><div className="flex justify-end gap-3"><button onClick={() => setShowAssignModal(null)} className="px-4 py-2 rounded-lg border border-input">Cancel</button><button onClick={submitAssignment} className="bg-primary text-white px-4 py-2 rounded-lg">Assign</button></div></div></div></div>}
    </div>
  );
}
