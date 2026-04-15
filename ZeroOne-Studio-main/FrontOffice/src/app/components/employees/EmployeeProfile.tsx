import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { employeesApi, skillsApi } from '../../lib/api';
import type { Employee, Skill, UserRole } from '../../lib/types';

interface EmployeeProfileProps { employeeId: string; onBack: () => void; userRole: UserRole; }

export function EmployeeProfile({ employeeId, onBack, userRole }: EmployeeProfileProps) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    const load = async () => {
      const [employeeData, skillData] = await Promise.all([employeesApi.get(employeeId), skillsApi.list({ employeeId })]);
      setEmployee(employeeData);
      setSkills(skillData.items);
    };
    load().catch(console.error);
  }, [employeeId]);

  const averageSkillLevel = useMemo(() => skills.length ? (skills.reduce((sum, skill) => sum + ((skill.assignments?.find((assignment) => assignment.employeeId === employeeId)?.level) || 0), 0) / skills.length).toFixed(1) : '0.0', [skills, employeeId]);

  const getLevelLabel = (level: number) => level >= 4 ? 'Expert' : level >= 3 ? 'Good' : level >= 2 ? 'Medium' : 'Low';
  const getLevelColor = (level: number) => level >= 4 ? 'bg-green-100 text-green-700' : level >= 3 ? 'bg-blue-100 text-blue-700' : level >= 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
  const getTypeColor = (type: string) => type === 'Knowledge' ? 'bg-purple-100 text-purple-700' : type === 'Know-How' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700';

  if (!employee) return <div className="p-6">Loading profile...</div>;

  return (
    <div className="p-6 space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-5 h-5" />Back to Employees</button>
      <div className="bg-white rounded-lg shadow-sm p-6 border border-border"><div className="flex items-start justify-between mb-6"><div className="flex items-start gap-6"><div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-semibold">{employee.fullName.slice(0,2).toUpperCase()}</div><div><h1 className="text-3xl mb-2 text-gray-900">{employee.fullName}</h1><p className="text-lg text-muted-foreground mb-4">{employee.position || userRole}</p><div className="flex flex-wrap gap-4 text-sm text-muted-foreground"><div className="flex items-center gap-2"><Mail className="w-4 h-4" /><span>{employee.email}</span></div>{employee.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" /><span>{employee.phone}</span></div>}{employee.location && <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /><span>{employee.location}</span></div>}{employee.joinedAt && <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /><span>Joined: {employee.joinedAt}</span></div>}</div></div></div></div><div className="grid grid-cols-3 gap-4 pt-6 border-t border-border"><div className="text-center"><p className="text-2xl font-semibold text-gray-900">{employee.skillsCount || 0}</p><p className="text-sm text-muted-foreground">Total Skills</p></div><div className="text-center"><p className="text-2xl font-semibold text-gray-900">{employee.activitiesCount || 0}</p><p className="text-sm text-muted-foreground">Activities</p></div><div className="text-center"><p className="text-2xl font-semibold text-gray-900">{employee.yearsOfExperience || 0}</p><p className="text-sm text-muted-foreground">Years Experience</p></div></div></div>
      <div className="bg-white rounded-lg shadow-sm p-6 border border-border"><h2 className="text-2xl mb-6 text-gray-900">Skills & Competencies</h2><div className="space-y-4">{skills.length === 0 ? <div className="text-muted-foreground">No skills assigned yet.</div> : skills.map((skill) => { const level = skill.assignments?.find((assignment) => assignment.employeeId === employeeId)?.level || 0; return <div key={skill._id} className="border border-border rounded-lg p-4"><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-3"><h3 className="font-medium text-gray-900">{skill.name}</h3><span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(skill.type)}`}>{skill.type}</span><span className={`text-xs px-2 py-1 rounded-full ${getLevelColor(level)}`}>{getLevelLabel(level)}</span></div><span className="text-sm text-muted-foreground">{(level / 4) * 100}%</span></div><div className="w-full bg-secondary rounded-full h-2"><div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${(level / 4) * 100}%` }} /></div></div>; })}</div><div className="mt-4 text-sm text-muted-foreground">Average assigned skill level: {averageSkillLevel}/4</div></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="bg-white rounded-lg shadow-sm p-6 border border-border"><h2 className="text-2xl mb-6 text-gray-900">Education</h2><div className="space-y-4">{employee.education?.length ? employee.education.map((item, index) => <div key={index} className="border border-border rounded-lg p-4"><h3 className="font-medium text-gray-900">{item.degree || 'Degree not provided'}</h3><p className="text-sm text-muted-foreground">{item.institution || 'Institution not provided'}</p><p className="text-sm text-muted-foreground">{item.fieldOfStudy || 'Field not provided'} • {item.startYear || '—'} - {item.endYear || '—'}</p>{item.grade && <p className="text-sm text-muted-foreground">Grade: {item.grade}</p>}{item.description && <p className="text-sm text-muted-foreground mt-2">{item.description}</p>}</div>) : <div className="text-muted-foreground">No education records.</div>}</div></div><div className="bg-white rounded-lg shadow-sm p-6 border border-border"><h2 className="text-2xl mb-6 text-gray-900">Certifications</h2><div className="space-y-4">{employee.certifications?.length ? employee.certifications.map((item, index) => <div key={index} className="border border-border rounded-lg p-4"><h3 className="font-medium text-gray-900">{item.name || 'Certification not provided'}</h3><p className="text-sm text-muted-foreground">Issuer: {item.issuer || '—'}</p><p className="text-sm text-muted-foreground">Issue: {item.issueDate || '—'} • Expiry: {item.expiryDate || '—'}</p>{item.credentialId && <p className="text-sm text-muted-foreground">Credential ID: {item.credentialId}</p>}{item.credentialUrl && <a href={item.credentialUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">Open credential link</a>}</div>) : <div className="text-muted-foreground">No certification records.</div>}</div></div></div>
    </div>
  );
}
