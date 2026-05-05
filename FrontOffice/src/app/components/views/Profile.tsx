import { useEffect, useMemo, useState } from 'react';
import { Mail, Briefcase, Calendar } from 'lucide-react';
import { activitiesApi, analyticsApi, employeesApi, skillsApi } from '../../lib/api';
import type { Activity, Employee, EmployeeEvolutionResponse, Skill, User } from '../../lib/types';

interface ProfileProps { user: User; }

export function Profile({ user }: ProfileProps) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [evolution, setEvolution] = useState<EmployeeEvolutionResponse | null>(null);

  useEffect(() => {
    const load = async () => {
      const employees = await employeesApi.list({ search: user.email });
      const matchedEmployee = employees.items.find((item) => item.email === user.email) || null;
      setEmployee(matchedEmployee);
      if (matchedEmployee?._id) {
        const [skillData, activityData, evolutionData] = await Promise.all([
          skillsApi.list({ employeeId: matchedEmployee._id }),
          activitiesApi.getMine(matchedEmployee._id),
          analyticsApi.employee(matchedEmployee._id),
        ]);
        setSkills(skillData.items);
        setActivities(activityData.items);
        setEvolution(evolutionData);
      }
    };
    load().catch(console.error);
  }, [user.email]);

  const handleUpdateProgress = async (activityId: string, currentProgress: number) => {
    const input = window.prompt('Enter new progress (0-100):', currentProgress.toString());
    if (input === null) return;
    const progress = Math.max(0, Math.min(100, parseInt(input) || 0));
    if (employee?._id) {
      try {
        await activitiesApi.updateProgress(activityId, employee._id, { progress });
        const activityData = await activitiesApi.getMine(employee._id);
        setActivities(activityData.items);
      } catch (err) {
        console.error(err);
        alert('Could not update progress');
      }
    }
  };

  const avgSkillLevel = useMemo(() => {
    if (!employee?._id || !skills.length) return '0.0';
    const total = skills.reduce((sum, skill) => sum + (skill.assignments?.find((assignment) => assignment.employeeId === employee._id)?.level || 0), 0);
    return (total / skills.length).toFixed(1);
  }, [employee, skills]);

  const getTypeColor = (type: string) => type === 'Knowledge' ? 'bg-purple-100 text-purple-700' : type === 'Know-How' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700';

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-3xl mb-2 text-gray-900">My Profile</h1><p className="text-muted-foreground">Employee self-service now includes skills proof, own activities, and evolution analytics.</p></div>
      <div className="bg-white rounded-lg shadow-sm p-6 border border-border"><div className="flex items-start gap-6 mb-6"><div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-semibold">{user.name.substring(0,2).toUpperCase()}</div><div><h2 className="text-2xl mb-2 text-gray-900">{user.name}</h2><div className="space-y-2 text-muted-foreground"><div className="flex items-center gap-2"><Mail className="w-4 h-4" /><span>{user.email}</span></div><div className="flex items-center gap-2"><Briefcase className="w-4 h-4" /><span>{employee?.position || user.role}</span></div><div className="flex items-center gap-2"><Calendar className="w-4 h-4" /><span>Joined {employee?.joinedAt || 'not set'}</span></div></div></div></div><div className="grid grid-cols-4 gap-4 pt-6 border-t border-border"><div className="text-center"><p className="text-2xl font-semibold text-gray-900">{skills.length}</p><p className="text-sm text-muted-foreground">Skills</p></div><div className="text-center"><p className="text-2xl font-semibold text-gray-900">{activities.length}</p><p className="text-sm text-muted-foreground">Activities</p></div><div className="text-center"><p className="text-2xl font-semibold text-gray-900">{avgSkillLevel}</p><p className="text-sm text-muted-foreground">Avg Skill Level</p></div><div className="text-center"><p className="text-2xl font-semibold text-gray-900">{evolution?.metrics.validatedSkills || 0}</p><p className="text-sm text-muted-foreground">Validated Skills</p></div></div></div>
      <div className="bg-white rounded-lg shadow-sm p-6 border border-border"><h2 className="text-2xl mb-6 text-gray-900">My Skills</h2><div className="space-y-4">{skills.length ? skills.map((skill) => { const assignment = skill.assignments?.find((item) => item.employeeId === employee?._id); const level = assignment?.level || 0; return <div key={skill._id} className="border border-border rounded-lg p-4"><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-3 flex-wrap"><h3 className="font-medium text-gray-900">{skill.name}</h3><span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(skill.type)}`}>{skill.type}</span><span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">Level {level}/4</span>{assignment?.validated ? <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Validated</span> : <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">Pending proof</span>}</div><span className="text-sm text-muted-foreground">{(level / 4) * 100}%</span></div><div className="w-full bg-secondary rounded-full h-2"><div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${(level / 4) * 100}%` }} /></div><div className="mt-3 text-sm text-muted-foreground">{assignment?.yearsOfExperience || 0} years exp • {assignment?.certificateName || 'No certificate linked'}</div><div className="mt-1 text-sm text-muted-foreground">{assignment?.evidenceNote || assignment?.notes || 'No proof note added yet.'}</div></div>; }) : <div className="text-muted-foreground">No skills linked to this account yet.</div>}</div></div>
      <div className="bg-white rounded-lg shadow-sm p-6 border border-border"><h2 className="text-2xl mb-6 text-gray-900">My Activities</h2><div className="space-y-4">{activities.length ? activities.map((activity) => { const enrollment = activity.enrollments?.find((item) => item.employeeId === employee?._id); return <div key={activity._id} className="border border-border rounded-lg p-4"><div className="flex items-center justify-between gap-3"><div><h3 className="font-medium text-gray-900">{activity.title}</h3><p className="text-sm text-muted-foreground">{activity.context} • {enrollment?.status || 'Not assigned'}</p></div><div className="text-right"><div className="text-lg font-semibold text-gray-900">{enrollment?.progress || 0}%</div><div className="text-xs text-muted-foreground">Progress</div></div></div><div className="mt-3 w-full bg-secondary rounded-full h-2"><div className="bg-primary h-2 rounded-full" style={{ width: `${enrollment?.progress || 0}%` }} /></div><div className="mt-2 text-sm text-muted-foreground">{enrollment?.managerDecision || enrollment?.notes || 'No manager note yet.'}</div><div className="flex items-center justify-between mt-2"><div className="text-xs text-muted-foreground">Proofs: {enrollment?.proofs?.length || 0}</div><button onClick={() => handleUpdateProgress(activity._id, enrollment?.progress || 0)} className="text-xs px-2 py-1 bg-secondary rounded hover:bg-secondary/80 text-gray-700">Update Progress</button></div></div>; }) : <div className="text-muted-foreground">No activities assigned to this account yet.</div>}</div></div>
      <div className="bg-white rounded-lg shadow-sm p-6 border border-border"><h2 className="text-2xl mb-6 text-gray-900">Evolution Analytics</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{evolution?.evolution?.length ? evolution.evolution.map((point) => <div key={point.step} className="border border-border rounded-lg p-4"><div className="text-sm text-muted-foreground">{point.step}</div><div className="text-2xl font-semibold text-gray-900">{point.score}%</div><div className="text-sm text-muted-foreground">{point.status}</div></div>) : <div className="text-muted-foreground">No evolution data yet.</div>}</div></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="bg-white rounded-lg shadow-sm p-6 border border-border"><h2 className="text-2xl mb-6 text-gray-900">Education</h2><div className="space-y-4">{employee?.education?.length ? employee.education.map((item, index) => <div key={index} className="border border-border rounded-lg p-4"><h3 className="font-medium text-gray-900">{item.degree || 'Degree not set'}</h3><p className="text-sm text-muted-foreground">{item.institution || 'Institution not set'}</p><p className="text-sm text-muted-foreground">{item.fieldOfStudy || 'Field not set'} • {item.startYear || '—'} - {item.endYear || '—'}</p></div>) : <div className="text-muted-foreground">No education records yet.</div>}</div></div><div className="bg-white rounded-lg shadow-sm p-6 border border-border"><h2 className="text-2xl mb-6 text-gray-900">Certifications</h2><div className="space-y-4">{employee?.certifications?.length ? employee.certifications.map((item, index) => <div key={index} className="border border-border rounded-lg p-4"><h3 className="font-medium text-gray-900">{item.name || 'Certification not set'}</h3><p className="text-sm text-muted-foreground">Issuer: {item.issuer || '—'}</p><p className="text-sm text-muted-foreground">Issue: {item.issueDate || '—'} • Expiry: {item.expiryDate || '—'}</p></div>) : <div className="text-muted-foreground">No certification records yet.</div>}</div></div></div>
    </div>
  );
}
