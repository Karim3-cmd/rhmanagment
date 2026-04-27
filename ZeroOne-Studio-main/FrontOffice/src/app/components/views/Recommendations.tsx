import { useEffect, useMemo, useState } from 'react';
import { Brain, RefreshCcw, Search } from 'lucide-react';
import { recommendationsApi, skillsApi } from '../../lib/api';
import type { Recommendation, User, UserRole, Skill } from '../../lib/types';

interface RecommendationsProps {
  userRole: UserRole;
  user: User;
}

export function Recommendations({ userRole, user }: RecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | Recommendation['status']>('All');
  const [skillFilter, setSkillFilter] = useState<string>('All');
  const [matchLevelFilter, setMatchLevelFilter] = useState<'All' | 'Strong' | 'Good' | 'Partial'>('All');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    skillsApi.list().then(res => setSkills(res.items)).catch(console.error);
  }, []);

  const loadRecommendations = async () => {
    const employeeId = user.role === 'Employee' ? undefined : undefined;
    const result = await recommendationsApi.list({
      search: searchTerm || undefined,
      status: statusFilter,
      employeeId,
      skill: skillFilter !== 'All' ? skillFilter : undefined,
      matchLevel: matchLevelFilter !== 'All' ? matchLevelFilter : undefined
    });
    setRecommendations(result.items);
  };

  useEffect(() => {
    loadRecommendations().catch(console.error);
  }, [searchTerm, statusFilter, skillFilter, matchLevelFilter]);

  const refreshRecommendations = async () => {
    setLoading(true);
    await recommendationsApi.refresh();
    await loadRecommendations();
    setLoading(false);
  };

  const updateStatus = async (recommendation: Recommendation, status: Recommendation['status']) => {
    await recommendationsApi.updateStatus(recommendation._id, status);
    await loadRecommendations();
  };

  const ordered = useMemo(
    () => [...recommendations].sort((a, b) => b.score - a.score),
    [recommendations],
  );

  const groupedByActivity = useMemo(() => {
    const map = new Map<string, Recommendation[]>();
    for (const rec of ordered) {
      if (!map.has(rec.activityId)) map.set(rec.activityId, []);
      map.get(rec.activityId)!.push(rec);
    }
    return Array.from(map.values());
  }, [ordered]);

  const scoreColor = (score: number) => score >= 80 ? 'text-green-600 bg-green-100' : score >= 60 ? 'text-blue-600 bg-blue-100' : 'text-yellow-700 bg-yellow-100';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2 text-gray-900">Recommendations</h1>
          <p className="text-muted-foreground">These are now generated from employees, skills and activities.</p>
        </div>
        <button onClick={refreshRecommendations} disabled={loading} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-60"><RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />Refresh Engine</button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-border flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by employee, activity or skill" className="w-full pl-10 pr-4 py-2 border border-input rounded-lg" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-4 py-2 border border-input rounded-lg">
          <option value="All">All statuses</option>
          <option value="Open">Open</option>
          <option value="Accepted">Accepted</option>
          <option value="Dismissed">Dismissed</option>
        </select>
        <select value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} className="px-4 py-2 border border-input rounded-lg max-w-[200px] truncate">
          <option value="All">All skills</option>
          {skills.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
        </select>
        <select value={matchLevelFilter} onChange={(e) => setMatchLevelFilter(e.target.value as any)} className="px-4 py-2 border border-input rounded-lg">
          <option value="All">All matches</option>
          <option value="Strong">Strong (≥ 80%)</option>
          <option value="Good">Good (60% - 79%)</option>
          <option value="Partial">Partial (&lt; 60%)</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {groupedByActivity.map((activityRecommendations) => {
          const first = activityRecommendations[0];
          return (
            <div key={first.activityId} className="bg-white rounded-lg shadow-sm p-6 border border-border space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary"><Brain className="w-5 h-5" /></div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{first.activityTitle}</h3>
                    <p className="text-sm text-muted-foreground">
                      Seats: {first.availableSeats} available / {first.activitySeats} total • Eligible employees (≥ 60%): {first.eligibleEmployeesCount}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {activityRecommendations.map((recommendation) => (
                  <div key={recommendation._id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h4 className="text-base font-semibold text-gray-900">{recommendation.employeeName}</h4>
                        <p className="text-sm text-muted-foreground">{recommendation.rationale}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${scoreColor(recommendation.score)}`}>{recommendation.score}% match</span>
                        <span className="px-3 py-1 rounded-full text-sm bg-secondary text-gray-700">{recommendation.status}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-900 mb-2">Matched skills</p>
                        <div className="flex flex-wrap gap-2">{recommendation.matchedSkills.length ? recommendation.matchedSkills.map((skill) => <span key={skill} className="px-3 py-1 rounded-full bg-green-100 text-green-700">{skill}</span>) : <span className="text-muted-foreground">No direct match yet.</span>}</div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 mb-2">Missing skills</p>
                        <div className="flex flex-wrap gap-2">{recommendation.missingSkills.length ? recommendation.missingSkills.map((skill) => <span key={skill} className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">{skill}</span>) : <span className="text-muted-foreground">No gap detected.</span>}</div>
                      </div>
                    </div>

                    {userRole === 'Manager' && (
                      <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                        <button onClick={() => updateStatus(recommendation, 'Accepted')} className="px-4 py-2 rounded-lg bg-green-600 text-white">Accept</button>
                        <button onClick={() => updateStatus(recommendation, 'Dismissed')} className="px-4 py-2 rounded-lg bg-yellow-500 text-white">Dismiss</button>
                        <button onClick={() => updateStatus(recommendation, 'Open')} className="px-4 py-2 rounded-lg border border-input">Reset</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
