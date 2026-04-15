import { useEffect, useMemo, useState } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Eye, X } from 'lucide-react';
import { employeesApi } from '../../lib/api';
import type { Employee, UserRole } from '../../lib/types';
import { EmployeeProfile } from '../employees/EmployeeProfile';

interface EmployeesProps { userRole: UserRole; }

type EmployeeFormState = Omit<Employee, '_id'>;

const emptyEmployee: EmployeeFormState = {
  fullName: '',
  email: '',
  phone: '',
  department: '',
  position: '',
  location: '',
  employmentType: 'Full-time',
  status: 'Active',
  managerName: '',
  yearsOfExperience: 0,
  skillsCount: 0,
  activitiesCount: 0,
  bio: '',
  joinedAt: '',
  education: [],
  certifications: [],
};

export function Employees({ userRole }: EmployeesProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeFormState>(emptyEmployee);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadEmployees = async () => {
    const result = await employeesApi.list();
    setEmployees(result.items);
  };

  useEffect(() => { loadEmployees().catch(console.error); }, []);

  const departments = useMemo(() => ['All', ...new Set(employees.map((employee) => employee.department).filter(Boolean) as string[])], [employees]);

  const filteredEmployees = useMemo(() => employees.filter((employee) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = !query || employee.fullName.toLowerCase().includes(query) || employee.email.toLowerCase().includes(query) || (employee.position || '').toLowerCase().includes(query) || (employee.department || '').toLowerCase().includes(query);
    const matchesDepartment = selectedDepartment === 'All' || employee.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  }), [employees, searchTerm, selectedDepartment]);

  const openCreate = () => { setEditingEmployee(null); setForm(emptyEmployee); setShowModal(true); setError(''); };
  const openEdit = (employee: Employee) => { setEditingEmployee(employee); setForm({ ...employee }); setShowModal(true); setError(''); };

  const saveEmployee = async () => {
    setSaving(true);
    setError('');
    try {
      if (editingEmployee) await employeesApi.update(editingEmployee._id, form);
      else await employeesApi.create(form);
      await loadEmployees();
      setShowModal(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not save employee');
    } finally {
      setSaving(false);
    }
  };

  const deleteEmployee = async (employee: Employee) => {
    if (!window.confirm(`Delete ${employee.fullName}?`)) return;
    await employeesApi.remove(employee._id);
    await loadEmployees();
  };

  if (selectedEmployee) return <EmployeeProfile employeeId={selectedEmployee} onBack={() => setSelectedEmployee(null)} userRole={userRole} />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-3xl mb-2 text-gray-900">Employees</h1><p className="text-muted-foreground">Live employee records from MongoDB.</p></div>{userRole === 'HR' && <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"><Plus className="w-5 h-5" />Add Employee</button>}</div>
      <div className="bg-white rounded-lg shadow-sm p-6 border border-border"><div className="flex flex-col md:flex-row gap-4"><div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><input type="text" placeholder="Search employees..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" /></div><div className="flex items-center gap-2"><Filter className="w-5 h-5 text-muted-foreground" /><select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">{departments.map((department) => <option key={department} value={department}>{department}</option>)}</select></div></div><div className="mt-4 text-sm text-muted-foreground">Showing {filteredEmployees.length} of {employees.length} employees</div></div>
      <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden"><table className="w-full"><thead className="bg-secondary border-b border-border"><tr><th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Employee</th><th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Department</th><th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Position</th><th className="text-center px-6 py-4 text-sm font-medium text-gray-900">Skills</th><th className="text-center px-6 py-4 text-sm font-medium text-gray-900">Activities</th><th className="text-right px-6 py-4 text-sm font-medium text-gray-900">Actions</th></tr></thead><tbody className="divide-y divide-border">{filteredEmployees.map((employee) => <tr key={employee._id} className="hover:bg-secondary/50 transition-colors"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">{employee.fullName.slice(0,2).toUpperCase()}</div><div><p className="font-medium text-gray-900">{employee.fullName}</p><p className="text-sm text-muted-foreground">{employee.email}</p></div></div></td><td className="px-6 py-4"><span className="inline-flex px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">{employee.department || '—'}</span></td><td className="px-6 py-4 text-gray-900">{employee.position || '—'}</td><td className="px-6 py-4 text-center"><span className="inline-flex px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700">{employee.skillsCount || 0}</span></td><td className="px-6 py-4 text-center"><span className="inline-flex px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">{employee.activitiesCount || 0}</span></td><td className="px-6 py-4"><div className="flex items-center justify-end gap-2"><button onClick={() => setSelectedEmployee(employee._id)} className="p-2 hover:bg-secondary rounded-lg transition-colors" title="View profile"><Eye className="w-4 h-4 text-muted-foreground" /></button>{userRole === 'HR' && <><button onClick={() => openEdit(employee)} className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Edit employee"><Edit className="w-4 h-4 text-muted-foreground" /></button><button onClick={() => deleteEmployee(employee)} className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Delete employee"><Trash2 className="w-4 h-4 text-destructive" /></button></>}</div></td></tr>)}</tbody></table></div>
      {showModal && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"><div className="flex items-center justify-between mb-6"><h2 className="text-2xl text-gray-900">{editingEmployee ? 'Edit Employee' : 'Add Employee'}</h2><button onClick={() => setShowModal(false)} className="p-2 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[['fullName','Full Name'],['email','Email'],['phone','Phone'],['department','Department'],['position','Position'],['location','Location'],['employmentType','Employment Type'],['status','Status'],['managerName','Manager Name'],['joinedAt','Joined At (YYYY-MM-DD)']].map(([key,label]) => <div key={key}><label className="block text-sm mb-2 text-gray-700">{label}</label><input value={(form as any)[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" /></div>)}<div><label className="block text-sm mb-2 text-gray-700">Years of Experience</label><input type="number" value={form.yearsOfExperience || 0} onChange={(e) => setForm({ ...form, yearsOfExperience: Number(e.target.value) })} className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" /></div><div><label className="block text-sm mb-2 text-gray-700">Activities Count</label><input type="number" value={form.activitiesCount || 0} onChange={(e) => setForm({ ...form, activitiesCount: Number(e.target.value) })} className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" /></div><div className="md:col-span-2"><label className="block text-sm mb-2 text-gray-700">Bio</label><textarea value={form.bio || ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-24" /></div></div>{error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}<div className="flex justify-end gap-3 mt-6"><button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-input">Cancel</button><button onClick={saveEmployee} disabled={saving} className="bg-primary text-white px-4 py-2 rounded-lg disabled:opacity-60">{saving ? 'Saving...' : editingEmployee ? 'Update Employee' : 'Create Employee'}</button></div></div></div>}
    </div>
  );
}
