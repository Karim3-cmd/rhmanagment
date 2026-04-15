import { useEffect, useState } from 'react';
import { BarChart, Bar, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { analyticsApi } from '../../lib/api';
import type { AnalyticsResponse, UserRole } from '../../lib/types';
import { Calendar, Target, TrendingUp, Users } from 'lucide-react';

interface AnalyticsProps {
  userRole: UserRole;
}

export function Analytics({ userRole }: AnalyticsProps) {
  const [data, setData] = useState<AnalyticsResponse | null>(null);

  useEffect(() => {
    analyticsApi.dashboard().then(setData).catch(console.error);
  }, []);

  const metrics = data ? [
    { title: 'Skills Added', value: String(data.metrics.skillsAdded), change: 'live', icon: <Target className="w-6 h-6" />, color: 'bg-blue-500' },
    { title: 'Avg. Skill Level', value: `${data.metrics.avgSkillLevel}/4`, change: 'live', icon: <TrendingUp className="w-6 h-6" />, color: 'bg-green-500' },
    { title: 'Active Employees', value: String(data.metrics.activeEmployees), change: userRole, icon: <Users className="w-6 h-6" />, color: 'bg-purple-500' },
    { title: 'Completion Rate', value: `${data.metrics.completionRate}%`, change: 'live', icon: <Calendar className="w-6 h-6" />, color: 'bg-orange-500' },
  ] : [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl mb-2 text-gray-900">Analytics & Reports</h1>
        <p className="text-muted-foreground">These charts are driven by the backend analytics module now.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-border">
            <div className="flex items-start justify-between mb-4"><div className={`${metric.color} text-white p-3 rounded-lg`}>{metric.icon}</div><span className="text-sm text-green-600 font-medium">{metric.change}</span></div>
            <h3 className="text-2xl font-semibold mb-1 text-gray-900">{metric.value}</h3>
            <p className="text-sm text-muted-foreground">{metric.title}</p>
          </div>
        ))}
      </div>

      {data && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-border">
              <h2 className="text-xl mb-4 text-gray-900">Employees by Department</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.employeesByDepartment}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" name="Employees" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-border">
              <h2 className="text-xl mb-4 text-gray-900">Top 5 Assigned Skills</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.topSkills}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10B981" name="Assignments" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-border flex flex-col items-center">
              <h2 className="text-xl mb-4 text-gray-900 w-full">Activity Statuses</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={data.activityStatuses} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {data.activityStatuses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#DC2626'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-border flex flex-col items-center">
              <h2 className="text-xl mb-4 text-gray-900 w-full">Recommendation Statuses</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={data.recommendationStatuses} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {data.recommendationStatuses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-border">
            <h2 className="text-xl mb-4 text-gray-900">Summary Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border-l-4 border-blue-500 pl-4"><p className="text-sm text-muted-foreground mb-1">Total Recommendations Made</p><p className="text-3xl font-semibold text-gray-900">{data.summary.totalRecommendations}</p></div>
              <div className="border-l-4 border-green-500 pl-4"><p className="text-sm text-muted-foreground mb-1">Successful Placements</p><p className="text-3xl font-semibold text-gray-900">{data.summary.successfulPlacements}</p></div>
              <div className="border-l-4 border-purple-500 pl-4"><p className="text-sm text-muted-foreground mb-1">Avg. Time to Match</p><p className="text-3xl font-semibold text-gray-900">{data.summary.averageTimeToMatch} days</p></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
