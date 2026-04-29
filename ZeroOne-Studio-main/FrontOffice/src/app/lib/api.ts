/// <reference types="vite/client" />

import axios from 'axios';
import type {
  Activity,
  AnalyticsResponse,
  Department,
  Employee,
  EmployeeEvolutionResponse,
  NotificationItem,
  Recommendation,
  Skill,
  User,
  UserRole,
  UserSettings,
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const TOKEN_KEY = 'hrbrain_token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = (): void => localStorage.removeItem(TOKEN_KEY);

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
  jobTitle?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  async register(payload: RegisterPayload, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.post<{ message: string; user: User }>('/auth/register', payload, config);
    return data;
  },
  async login(payload: LoginPayload, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.post<{ message: string; access_token: string; user: User }>('/auth/login', payload, config);
    if (data.access_token) {
      setToken(data.access_token);
    }
    return data;
  },
  logout() {
    removeToken();
  },
  async listUsers(customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.get<{ total: number; items: User[] }>('/users', config);
    return data;
  },
  async getUser(id: string, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.get<User>(`/users/${id}`, config);
    return data;
  },
};

export const employeesApi = {
  async list(params?: { search?: string; department?: string }, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { params, headers: customHeaders } : { params };
    const { data } = await api.get<{ total: number; items: Employee[] }>('/employees', config);
    return data;
  },
  async get(id: string, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.get<Employee>(`/employees/${id}`, config);
    return data;
  },
  async create(payload: Partial<Employee>, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.post<Employee>('/employees', payload, config);
    return data;
  },
  async update(id: string, payload: Partial<Employee>, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.patch<Employee>(`/employees/${id}`, payload, config);
    return data;
  },
  async remove(id: string, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.delete<{ message: string }>(`/employees/${id}`, config);
    return data;
  },
};

export const departmentsApi = {
  async list(customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.get<{ total: number; items: Department[] }>('/departments', config);
    return data;
  },
  async get(id: string, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.get<Department>(`/departments/${id}`, config);
    return data;
  },
  async create(payload: Partial<Department>, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.post<Department>('/departments', payload, config);
    return data;
  },
  async update(id: string, payload: Partial<Department>, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.patch<Department>(`/departments/${id}`, payload, config);
    return data;
  },
  async remove(id: string, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.delete<{ message: string }>(`/departments/${id}`, config);
    return data;
  },
};

export const skillsApi = {
  async list(params?: { search?: string; type?: string; employeeId?: string }, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { params, headers: customHeaders } : { params };
    const { data } = await api.get<{ total: number; items: Skill[] }>('/skills', config);
    let items = data.items;
    if (params?.employeeId) {
      items = items.filter((skill) => (skill.assignments || []).some((assignment) => assignment.employeeId === params.employeeId));
    }
    return { ...data, items };
  },
  async get(id: string, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.get<Skill>(`/skills/${id}`, config);
    return data;
  },
  async create(payload: Partial<Skill>, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.post<Skill>('/skills', payload, config);
    return data;
  },
  async update(id: string, payload: Partial<Skill>, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.patch<Skill>(`/skills/${id}`, payload, config);
    return data;
  },
  async remove(id: string, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.delete<{ message: string }>(`/skills/${id}`, config);
    return data;
  },
  async assign(skillId: string, payload: { employeeId: string; notes?: string; yearsOfExperience?: number; certificateName?: string; certificateUrl?: string; evidenceNote?: string; validated?: boolean; validatedBy?: string }, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.post<Skill>(`/skills/${skillId}/assign`, payload, config);
    return data;
  },
  async unassign(skillId: string, employeeId: string, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.delete<Skill>(`/skills/${skillId}/assign/${employeeId}`, config);
    return data;
  },
};

export const activitiesApi = {
  async list(params?: { search?: string; context?: string; status?: string; targetDepartment?: string; employeeId?: string; onlyMine?: boolean }, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { params, headers: customHeaders } : { params };
    const { data } = await api.get<{ total: number; items: Activity[] }>('/activities', config);
    return data;
  },
  async getMine(employeeId: string, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.get<{ total: number; items: Activity[] }>(`/activities/my/${employeeId}`, config);
    return data;
  },
  async get(id: string, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.get<Activity>(`/activities/${id}`, config);
    return data;
  },
  async getCandidates(id: string, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.get<{ activityId: string; activityTitle: string; items: Recommendation[] }>(`/activities/${id}/candidates`, config);
    return data;
  },
  async create(payload: Partial<Activity>, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.post<Activity>('/activities', payload, config);
    return data;
  },
  async update(id: string, payload: Partial<Activity>, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.patch<Activity>(`/activities/${id}`, payload, config);
    return data;
  },
  async remove(id: string, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.delete<{ message: string }>(`/activities/${id}`, config);
    return data;
  },
  async enroll(activityId: string, payload: { employeeId: string; notes?: string }, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.post<Activity>(`/activities/${activityId}/enroll`, payload, config);
    return data;
  },
  async review(activityId: string, employeeId: string, payload: { decision: 'Approved' | 'Rejected'; note?: string; reviewedBy?: string }, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.patch<Activity>(`/activities/${activityId}/review/${employeeId}`, payload, config);
    return data;
  },
  async submitProof(activityId: string, employeeId: string, proofData: { title: string; type: string; url: string; note: string }, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.post(`/activities/${activityId}/proofs/${employeeId}`, proofData, config);
    return data;
  },
  async reviewProof(activityId: string, employeeId: string, proofIndex: number, reviewData: { decision: 'approved' | 'rejected'; reviewNote: string; reviewedBy: string; progressWeight?: number }, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.patch(`/activities/${activityId}/proofs/${employeeId}/${proofIndex}`, reviewData, config);
    return data;
  },
  async updateProgress(activityId: string, employeeId: string, payload: { progress?: number; notes?: string; proofs?: Array<{ title?: string; type?: string; url?: string; note?: string }> }, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.patch<Activity>(`/activities/${activityId}/progress/${employeeId}`, payload, config);
    return data;
  },
  async unenroll(activityId: string, employeeId: string, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.delete<Activity>(`/activities/${activityId}/enroll/${employeeId}`, config);
    return data;
  },
  async assign(activityId: string, payload: { employeeId: string; notes?: string }, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.post<Activity>(`/activities/${activityId}/assign`, payload, config);
    return data;
  },
  async getPendingApprovals(managerId: string, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.get<{ total: number; items: Array<{ activityId: string; activityTitle: string; employeeId: string; employeeName: string; employeeDepartment: string; enrolledAt: string; notes: string }> }>(`/activities/pending-approvals/${managerId}`, config);
    return data;
  },
  async approveEnrollment(activityId: string, employeeId: string, reviewedBy: string, reviewNote?: string, progressWeight?: number, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.post<Activity>(`/activities/${activityId}/approve/${employeeId}`, { reviewedBy, reviewNote, progressWeight }, config);
    return data;
  },
  async rejectEnrollment(activityId: string, employeeId: string, reviewedBy: string, reviewNote?: string, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.post<Activity>(`/activities/${activityId}/reject/${employeeId}`, { reviewedBy, reviewNote }, config);
    return data;
  },
};

export const recommendationsApi = {
  async list(params?: { search?: string; skill?: string; matchLevel?: string; status?: string; employeeId?: string; activityId?: string }, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { params, headers: customHeaders } : { params };
    const { data } = await api.get<{ total: number; items: Recommendation[] }>('/recommendations', config);
    return data;
  },
  async refresh(customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.post<{ total: number; items: Recommendation[] }>('/recommendations/refresh', {}, config);
    return data;
  },
  async matchJobDescription(payload: { jobDescription: string; department?: string; minYearsExperience?: number }, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.post<{
      total: number;
      requiredSkills: string[];
      items: Array<{
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
      }>;
    }>('/recommendations/job-match', payload, config);
    return data;
  },
  async updateStatus(id: string, status: Recommendation['status'], customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.patch<Recommendation>(`/recommendations/${id}/status`, { status }, config);
    return data;
  },
};

export const analyticsApi = {
  async dashboard(customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.get<AnalyticsResponse>('/analytics/dashboard', config);
    return data;
  },
  async employee(employeeId: string, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.get<EmployeeEvolutionResponse>(`/analytics/employee/${employeeId}`, config);
    return data;
  },
};

export const notificationsApi = {
  async list(params?: { userId?: string; filter?: 'all' | 'unread'; category?: string }, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { params, headers: customHeaders } : { params };
    const { data } = await api.get<{ total: number; unread: number; items: NotificationItem[] }>('/notifications', config);
    return data;
  },
  async seed(userId: string, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.post<{ message: string }>(`/notifications/seed/${userId}`, {}, config);
    return data;
  },
  async markRead(id: string, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.patch<NotificationItem>(`/notifications/${id}/read`, {}, config);
    return data;
  },
  async markAllRead(userId: string, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.patch<{ message: string }>(`/notifications/read/all/${userId}`, {}, config);
    return data;
  },
  async remove(id: string, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.delete<{ message: string }>(`/notifications/${id}`, config);
    return data;
  },
};

export const settingsApi = {
  async get(userId: string, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.get<UserSettings>(`/settings/${userId}`, config);
    return data;
  },
  async update(userId: string, payload: Partial<UserSettings>, customHeaders?: Record<string, string>) {
    const config = customHeaders ? { headers: customHeaders } : {};
    const { data } = await api.patch<UserSettings>(`/settings/${userId}`, payload, config);
    return data;
  },
};

export const aiApi = {
  async recommendEmployees(description: string, department?: string) {
    const { data } = await api.post<{
      success: boolean;
      extractedSkills: string[];
      recommendations: Array<{
        employeeId: string;
        employeeName: string;
        department: string;
        score: number;
        matchedSkills: Array<{ skill: string; rating: number }>;
        missingSkills: string[];
        isFromOtherDepartment: boolean;
      }>;
    }>('/ai/recommend-employees', { description, department });
    return data;
  },
};
