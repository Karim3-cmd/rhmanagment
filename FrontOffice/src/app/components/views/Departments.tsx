import { useEffect, useMemo, useState } from 'react';
import { Building2, Edit, Plus, Search, Trash2, X } from 'lucide-react';
import { departmentsApi } from '../../lib/api';
import type { Department, UserRole } from '../../lib/types';

interface DepartmentsProps {
  userRole: UserRole;
  user: User;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
}

const emptyForm: Partial<Department> = {
  name: '',
  description: '',
};

export function Departments({ userRole }: DepartmentsProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [form, setForm] = useState<Partial<Department>>(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const deptData = await departmentsApi.list();
      setDepartments(deptData.items);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDepartments = useMemo(() => {
    return departments.filter(
      (dept) =>
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dept.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [departments, searchTerm]);

  const openCreate = () => {
    setEditingDepartment(null);
    setForm({ ...emptyForm });
    setError('');
    setShowModal(true);
  };

  const openEdit = (dept: Department) => {
    setEditingDepartment(dept);
    setForm({ name: dept.name, description: dept.description });
    setError('');
    setShowModal(true);
  };

  const saveDepartment = async () => {
    try {
      if (editingDepartment) {
        await departmentsApi.update(editingDepartment._id, form);
      } else {
        await departmentsApi.create(form);
      }
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not save department');
    }
  };

  const deleteDepartment = async (dept: Department) => {
    if (!window.confirm(`Delete ${dept.name}?`)) return;
    try {
      await departmentsApi.remove(dept._id);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Could not delete department');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2 text-gray-900">Departments</h1>
          <p className="text-muted-foreground">Manage departments.</p>
        </div>
        {userRole === 'HR' && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Department
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredDepartments.length} of {departments.length} departments
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((dept) => (
          <div
            key={dept._id}
            className="bg-white rounded-lg shadow-sm p-6 border border-border hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {dept.description || 'No description'}
                  </p>
                </div>
              </div>
              {userRole === 'HR' && (
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(dept)}
                    className="p-2 hover:bg-secondary rounded-lg"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => deleteDepartment(dept)}
                    className="p-2 hover:bg-secondary rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      )}

      {!loading && filteredDepartments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No departments found. {userRole === 'HR' && 'Create your first department!'}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-gray-900">
                {editingDepartment ? 'Edit Department' : 'Create Department'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-secondary rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-gray-700">Name *</label>
                <input
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg"
                  placeholder="e.g., Engineering"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">Description</label>
                <textarea
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg min-h-20"
                  placeholder="Department description..."
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-input"
                >
                  Cancel
                </button>
                <button
                  onClick={saveDepartment}
                  className="bg-primary text-white px-4 py-2 rounded-lg"
                >
                  {editingDepartment ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
