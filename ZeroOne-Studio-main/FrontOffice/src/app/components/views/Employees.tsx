import { useEffect, useMemo, useState } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Eye, X } from 'lucide-react';
import { authApi, departmentsApi, employeesApi } from '../../lib/api';
import type { Employee, User, UserRole } from '../../lib/types';
import { EmployeeProfile } from '../employees/EmployeeProfile';

interface EmployeesProps { userRole: UserRole; }

type EmployeeFormState = Omit<Employee, '_id'>;

const emptyEmployee: EmployeeFormState = {
  userId: '',
  fullName: '',
  email: '',
  phone: '',
  department: '',
  position: '',
  location: '',
  employmentType: 'Full-time',
  status: 'Active',
  yearsOfExperience: 0,
  skillsCount: 0,
  bio: '',
  joinedAt: '',
  education: [],
  certifications: [],
};

export function Employees({ userRole }: EmployeesProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<{ _id: string; name: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeFormState>(emptyEmployee);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadEmployees = async () => {
    const [empResult, userResult, deptResult] = await Promise.all([
      employeesApi.list(),
      authApi.listUsers(),
      departmentsApi.list(),
    ]);
    setEmployees(empResult.items);
    setUsers(userResult.items);
    setDepartments(deptResult.items);
  };

  useEffect(() => { loadEmployees().catch(console.error); }, []);

  const departmentNames = useMemo(() => ['All', ...new Set(employees.map((employee) => employee.department).filter(Boolean) as string[])], [employees]);

  const filteredEmployees = useMemo(() => employees.filter((employee) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = !query || employee.fullName.toLowerCase().includes(query) || employee.email.toLowerCase().includes(query) || (employee.position || '').toLowerCase().includes(query) || (employee.department || '').toLowerCase().includes(query);
    const matchesDepartment = selectedDepartment === 'All' || employee.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  }), [employees, searchTerm, selectedDepartment]);

  const availableUsers = useMemo(() => {
    // Filter users who don't have an employee yet
    const employeeEmails = new Set(employees.map(e => e.email.toLowerCase()));
    return users.filter(u => !employeeEmails.has(u.email.toLowerCase()));
  }, [users, employees]);

  const openCreate = () => {
    setEditingEmployee(null);
    setSelectedUserId('');
    setForm({ ...emptyEmployee, department: selectedDepartment === 'All' ? '' : selectedDepartment });
    setShowModal(true);
    setError('');
  };

  const openEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    // Find the user that matches this employee
    const matchingUser = users.find(u => u.email.toLowerCase() === employee.email.toLowerCase());
    setSelectedUserId(matchingUser?._id || '');
    setForm({ ...employee });
    setShowModal(true);
    setError('');
  };

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    const user = users.find(u => u._id === userId);
    if (user) {
      setForm({
        ...form,
        userId: user._id,
        fullName: user.name,
        email: user.email,
      });
    }
  };

  const saveEmployee = async () => {
    setSaving(true);
    setError('');
    try {
      // Required fields validation
      if (!form.userId && !editingEmployee) {
        setError('Please select a user.');
        return;
      }
      if (!form.department) {
        setError('Department is required.');
        return;
      }
      if (!form.position) {
        setError('Position is required.');
        return;
      }

      const phone = (form.phone || '').trim();
      const joinedAt = (form.joinedAt || '').trim();

      // Phone validation: must start with +216 followed by 8 digits
      if (phone && !/^\+216\d{8}$/.test(phone)) {
        setError('Phone must start with +216 followed by 8 digits (e.g., +21698765432).');
        return;
      }

      if (joinedAt && Number.isNaN(Date.parse(joinedAt))) {
        setError('Joined At must be a valid date.');
        return;
      }

      const payload = {
        ...form,
        phone,
        joinedAt,
      };

      if (editingEmployee) await employeesApi.update(editingEmployee._id, payload);
      else await employeesApi.create(payload);
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

  const getUserRole = (email: string) => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return user?.role || 'Employee';
  };

  if (selectedEmployee) return <EmployeeProfile employeeId={selectedEmployee} onBack={() => setSelectedEmployee(null)} userRole={userRole} />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-3xl mb-2 text-gray-900">Employees</h1><p className="text-muted-foreground">Live employee records from MongoDB.</p></div>{userRole === 'HR' && <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"><Plus className="w-5 h-5" />Add Employee</button>}</div>
      <div className="bg-white rounded-lg shadow-sm p-6 border border-border"><div className="flex flex-col md:flex-row gap-4"><div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><input type="text" placeholder="Search employees..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" /></div><div className="flex items-center gap-2"><Filter className="w-5 h-5 text-muted-foreground" /><select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">{departmentNames.map((department) => <option key={department} value={department}>{department}</option>)}</select></div></div><div className="mt-4 text-sm text-muted-foreground">Showing {filteredEmployees.length} of {employees.length} employees</div></div>
      <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden"><table className="w-full"><thead className="bg-secondary border-b border-border"><tr><th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Employee</th><th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Department</th><th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Position</th><th className="text-center px-6 py-4 text-sm font-medium text-gray-900">Skills</th><th className="text-center px-6 py-4 text-sm font-medium text-gray-900">Activities</th><th className="text-right px-6 py-4 text-sm font-medium text-gray-900">Actions</th></tr></thead><tbody className="divide-y divide-border">{filteredEmployees.map((employee) => <tr key={employee._id} className="hover:bg-secondary/50 transition-colors"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">{employee.fullName.slice(0,2).toUpperCase()}</div><div><p className="font-medium text-gray-900">{employee.fullName}</p><p className="text-sm text-muted-foreground">{employee.email}</p></div></div></td><td className="px-6 py-4"><span className="inline-flex px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">{employee.department || '—'}</span></td><td className="px-6 py-4 text-gray-900">{employee.position || '—'}</td><td className="px-6 py-4 text-center"><span className="inline-flex px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700">{employee.skillsCount || 0}</span></td><td className="px-6 py-4 text-center"><span className="inline-flex px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">{employee.activitiesCount || 0}</span></td><td className="px-6 py-4"><div className="flex items-center justify-end gap-2"><button onClick={() => setSelectedEmployee(employee._id)} className="p-2 hover:bg-secondary rounded-lg transition-colors" title="View profile"><Eye className="w-4 h-4 text-muted-foreground" /></button>{userRole === 'HR' && <><button onClick={() => openEdit(employee)} className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Edit employee"><Edit className="w-4 h-4 text-muted-foreground" /></button><button onClick={() => deleteEmployee(employee)} className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Delete employee"><Trash2 className="w-4 h-4 text-destructive" /></button></>}</div></td></tr>)}</tbody></table></div>
      {showModal && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"><div className="flex items-center justify-between mb-6"><h2 className="text-2xl text-gray-900">{editingEmployee ? 'Edit Employee' : 'Add Employee'}</h2><button onClick={() => setShowModal(false)} className="p-2 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button></div>
      
      {/* User Selection - Only for new employees */}
      {!editingEmployee && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <label className="block text-sm mb-2 text-gray-700 font-medium">Select User *</label>
          <select
            value={selectedUserId}
            onChange={(e) => handleUserChange(e.target.value)}
            className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select a user...</option>
            {availableUsers.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.email}) - {user.role}
              </option>
            ))}
          </select>
          {selectedUserId && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Role: </span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                users.find(u => u._id === selectedUserId)?.role === 'Manager' 
                  ? 'bg-orange-100 text-orange-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {users.find(u => u._id === selectedUserId)?.role || 'Employee'}
              </span>
            </div>
          )}
        </div>
      )}

      {editingEmployee && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="text-sm">
            <span className="font-medium">User Role: </span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              getUserRole(form.email || '') === 'Manager' 
                ? 'bg-orange-100 text-orange-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {getUserRole(form.email || '')}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-2 text-gray-700">Full Name</label>
          <input 
            value={form.fullName || ''} 
            onChange={(e) => setForm({ ...form, fullName: e.target.value })} 
            className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" 
            disabled={!!selectedUserId}
          />
        </div>
        <div>
          <label className="block text-sm mb-2 text-gray-700">Email</label>
          <input 
            value={form.email || ''} 
            onChange={(e) => setForm({ ...form, email: e.target.value })} 
            className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" 
            disabled={!!selectedUserId}
          />
        </div>
        <div>
          <label className="block text-sm mb-2 text-gray-700">Department *</label>
          <select
            value={form.department || ''}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select department...</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept.name}>{dept.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-2 text-gray-700">Position *</label>
          <input 
            value={form.position || ''} 
            onChange={(e) => setForm({ ...form, position: e.target.value })} 
            className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" 
          />
        </div>
        <div>
          <label className="block text-sm mb-2 text-gray-700">Location</label>
          <input 
            value={form.location || ''} 
            onChange={(e) => setForm({ ...form, location: e.target.value })} 
            className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" 
          />
        </div>
        <div>
          <label className="block text-sm mb-2 text-gray-700">Employment Type *</label>
          <select
            value={form.employmentType || 'Full-time'}
            onChange={(e) => setForm({ ...form, employmentType: e.target.value as any })}
            className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Intern">Intern</option>
            <option value="Freelance">Freelance</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-2 text-gray-700">Status *</label>
          <select
            value={form.status || 'Active'}
            onChange={(e) => setForm({ ...form, status: e.target.value as any })}
            className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="On Leave">On Leave</option>
            <option value="Suspended">Suspended</option>
            <option value="Left Company">Left Company</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-2 text-gray-700">Phone (+216...)</label>
          <input
            value={form.phone || ''}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="+21698765432"
          />
        </div>
        <div>
          <label className="block text-sm mb-2 text-gray-700">Joined At</label>
          <input 
            type="date" 
            value={form.joinedAt || ''} 
            onChange={(e) => setForm({ ...form, joinedAt: e.target.value })} 
            className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" 
          />
        </div>
        <div>
          <label className="block text-sm mb-2 text-gray-700">Years of Experience</label>
          <input 
            type="number" 
            value={form.yearsOfExperience || 0} 
            onChange={(e) => setForm({ ...form, yearsOfExperience: Number(e.target.value) })} 
            className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" 
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-2 text-gray-700">Bio</label>
          <textarea 
            value={form.bio || ''} 
            onChange={(e) => setForm({ ...form, bio: e.target.value })} 
            className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-24" 
          />
        </div>
      </div>
      {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="flex justify-end gap-3 mt-6"><button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-input">Cancel</button><button onClick={saveEmployee} disabled={saving} className="bg-primary text-white px-4 py-2 rounded-lg disabled:opacity-60">{saving ? 'Saving...' : editingEmployee ? 'Update Employee' : 'Create Employee'}</button></div></div></div>}
    </div>
  );
}
