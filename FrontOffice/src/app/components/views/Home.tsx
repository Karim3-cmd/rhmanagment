import { useEffect, useMemo, useState } from 'react';
import { Users, Brain, Activity, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { employeesApi, skillsApi } from '../../lib/api';
import type { UserRole, Employee, Skill } from '../../lib/types';

interface HomeProps { userRole: UserRole; }

const skillGapColors = ['#DC2626', '#F59E0B', '#3B82F6', '#10B981'];

export function Home({ userRole }: HomeProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [employeeData, skillData] = await Promise.all([employeesApi.list(), skillsApi.list()]);
        setEmployees(employeeData.items);
        setSkills(skillData.items);
      } catch (error) {
        console.error(error);
      }
    };
    load();
  }, []);

  const metrics = useMemo(() => {
    const departments = new Set(employees.map((employee) => employee.department).filter(Boolean)).size;
    const avgLevel = skills.length ? (skills.reduce((sum, skill) => sum + (skill.averageLevel || 0), 0) / skills.length).toFixed(1) : '0.0';
    return [
      { title: 'Total Employees', value: String(employees.length), change: `${departments} departments`, icon: <Users className="w-6 h-6" />, color: 'bg-blue-500' },
      { title: 'Skills Catalog', value: String(skills.length), change: `${avgLevel}/4 avg level`, icon: <Brain className="w-6 h-6" />, color: 'bg-purple-500' },
      { title: 'Ongoing Activities', value: String(employees.reduce((sum, employee) => sum + (employee.activitiesCount || 0), 0)), change: 'from employee records', icon: <Activity className="w-6 h-6" />, color: 'bg-green-500' },
      { title: 'Pending Recommendations', value: String(skills.filter((skill) => (skill.employeeCount || 0) === 0).length), change: 'skills with no assignee', icon: <Target className="w-6 h-6" />, color: 'bg-orange-500' },
    ];
  }, [employees, skills]);

  const skillsDistributionData = useMemo(() => {
    const map = new Map<string, number>();
    employees.forEach((employee) => {
      const department = employee.department || 'Unassigned';
      map.set(department, (map.get(department) || 0) + (employee.skillsCount || 0));
    });
    return Array.from(map.entries()).map(([department, value]) => ({ department, skills: value }));
  }, [employees]);

  const skillGapsData = useMemo(() => {
    const bands = [0, 0, 0, 0];
    skills.forEach((skill) => {
      const avg = skill.averageLevel || 0;
      if (avg === 0) bands[0] += 1;
      else if (avg < 2) bands[1] += 1;
      else if (avg < 3) bands[2] += 1;
      else bands[3] += 1;
    });
    return [
      { name: 'Critical', value: bands[0], color: skillGapColors[0] },
      { name: 'High', value: bands[1], color: skillGapColors[1] },
      { name: 'Medium', value: bands[2], color: skillGapColors[2] },
      { name: 'Low', value: bands[3], color: skillGapColors[3] },
    ];
  }, [skills]);

  const alerts = useMemo(() => [
    { type: 'critical', title: `${skills.filter((skill) => (skill.employeeCount || 0) === 0).length} unassigned skills`, description: 'These skills exist in the catalog but are attached to no employee.', time: 'Live data' },
    { type: 'warning', title: `${employees.filter((employee) => (employee.skillsCount || 0) === 0).length} employees have no skills`, description: 'Their profiles need skill assignments before recommendations can work.', time: 'Live data' },
    { type: 'info', title: `${employees.length} employees loaded`, description: `${skills.length} skills currently available in the platform.`, time: userRole },
  ], [employees, skills, userRole]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl mb-2 text-gray-900">Dashboard</h1>
        <p className="text-muted-foreground">Live overview from the backend, not hardcoded theater.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{metrics.map((metric, index) => <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-border hover:shadow-md transition-shadow"><div className="flex items-start justify-between mb-4"><div className={`${metric.color} text-white p-3 rounded-lg`}>{metric.icon}</div><div className="flex items-center gap-1 text-sm"><TrendingUp className="w-4 h-4 text-green-600" /><span className="text-green-600">{metric.change}</span></div></div><h3 className="text-2xl font-semibold mb-1 text-gray-900">{metric.value}</h3><p className="text-sm text-muted-foreground">{metric.title}</p></div>)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-border"><h2 className="text-xl mb-4 text-gray-900">Skills Distribution by Department</h2><ResponsiveContainer width="100%" height={300}><BarChart data={skillsDistributionData}><CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" /><XAxis dataKey="department" stroke="#6B7280" /><YAxis stroke="#6B7280" /><Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }} /><Bar dataKey="skills" fill="#1E3A8A" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-border"><h2 className="text-xl mb-4 text-gray-900">Skill Gaps Overview</h2><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={skillGapsData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} outerRadius={100} dataKey="value">{skillGapsData.map((entry, index) => <Cell key={index} fill={entry.color} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6 border border-border"><div className="flex items-center justify-between mb-4"><h2 className="text-xl text-gray-900">Recent Alerts & Notifications</h2></div><div className="space-y-4">{alerts.map((alert, index) => <div key={index} className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-secondary transition-colors"><div className={`p-2 rounded-lg ${alert.type === 'critical' ? 'bg-red-100' : alert.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'}`}><AlertCircle className={`w-5 h-5 ${alert.type === 'critical' ? 'text-red-600' : alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'}`} /></div><div className="flex-1"><h3 className="font-medium text-gray-900 mb-1">{alert.title}</h3><p className="text-sm text-muted-foreground mb-2">{alert.description}</p><p className="text-xs text-muted-foreground">{alert.time}</p></div></div>)}</div></div>
    </div>
  );
}
