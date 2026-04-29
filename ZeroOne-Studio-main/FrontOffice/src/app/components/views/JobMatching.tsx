import { useState } from 'react';
import { Search, User, Building2, Calendar, CheckCircle, XCircle, Loader2, Sparkles } from 'lucide-react';
import { recommendationsApi } from '../../lib/api';

interface JobMatchResult {
  employee: {
    _id: string;
    fullName: string;
    email: string;
    department: string;
    position: string;
    yearsOfExperience: number;
  };
  score: number;
  explanation: string;
  matchedSkills: string[];
  missingSkills: string[];
}

export function JobMatching() {
  const [jobDescription, setJobDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [minYears, setMinYears] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<JobMatchResult[] | null>(null);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await recommendationsApi.matchJobDescription({
        jobDescription,
        department: department || undefined,
        minYearsExperience: minYears ? Number(minYears) : undefined,
      });

      setResults(response.items);
      setRequiredSkills(response.requiredSkills);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to find matching candidates');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2 text-gray-900">AI Job Matching</h1>
          <p className="text-muted-foreground">
            Enter a job description to find the best matching employees using AI.
          </p>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-border space-y-4">
        <div>
          <label className="block text-sm mb-2 text-gray-700 font-medium">
            Job Description *
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Need a senior backend developer with Node.js and Kafka experience for scalable microservices..."
            className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-32"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-2 text-gray-700">
              Department (optional)
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Engineering"
              className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm mb-2 text-gray-700">
              Min Years Experience (optional)
            </label>
            <input
              type="number"
              value={minYears}
              onChange={(e) => setMinYears(e.target.value ? Number(e.target.value) : '')}
              placeholder="3"
              min="0"
              className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {requiredSkills.length > 0 && (
              <span>Extracted skills: {requiredSkills.join(', ')}</span>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !jobDescription.trim()}
            className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {loading ? 'Analyzing...' : 'Find Candidates'}
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {results && results.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-border">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Matching Candidates ({results.length})
              </h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4" />
                <span>Ranked by AI</span>
              </div>
            </div>
          </div>

          <div className="divide-y divide-border">
            {results.map((result, index) => (
              <div
                key={result.employee._id}
                className={`p-6 ${index === 0 ? 'bg-green-50/50' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        index === 0
                          ? 'bg-yellow-100 text-yellow-700'
                          : index === 1
                          ? 'bg-gray-100 text-gray-700'
                          : index === 2
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-50 text-gray-600'
                      }`}
                    >
                      #{index + 1}
                    </div>
                  </div>

                  {/* Employee Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {result.employee.fullName}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {result.employee.department || 'No department'}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {result.employee.position || 'No position'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {result.employee.yearsOfExperience} years exp
                          </span>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {result.score}%
                        </div>
                        <div className="text-xs text-muted-foreground">Match Score</div>
                      </div>
                    </div>

                    {/* AI Explanation */}
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <Sparkles className="w-4 h-4 inline mr-1" />
                        {result.explanation}
                      </p>
                    </div>

                    {/* Skills */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {result.matchedSkills.length > 0 && (
                        <>
                          {result.matchedSkills.map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-green-100 text-green-700"
                            >
                              <CheckCircle className="w-3 h-3" />
                              {skill}
                            </span>
                          ))}
                        </>
                      )}
                      {result.missingSkills.length > 0 && (
                        <>
                          {result.missingSkills.map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-red-100 text-red-700"
                            >
                              <XCircle className="w-3 h-3" />
                              {skill}
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results && results.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow-sm p-12 border border-border text-center">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No matching candidates found</h3>
          <p className="text-muted-foreground">
            Try adjusting your job description or removing some filters.
          </p>
        </div>
      )}
    </div>
  );
}
