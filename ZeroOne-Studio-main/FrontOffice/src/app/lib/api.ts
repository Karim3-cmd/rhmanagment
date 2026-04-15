import axios from 'axios';
import type {
  Activity,
  AnalyticsResponse,
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

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

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
  async register(payload: RegisterPayload) {
    const { data } = await api.post<{ message: string; user: User }>('/auth/register', payload);
    return data;
  },
  async login(payload: LoginPayload) {
    const { data } = await api.post<{ message: string; user: User }>('/auth/login', payload);
    return data;
  },
  async listUsers() {
    const { data } = await api.get<{ total: number; items: User[] }>('/users');
    return data;
  },
  async getUser(id: string) {
    const { data } = await api.get<User>(`/users/${id}`);
    return data;
  },
};

export const employeesApi = {
  async list(params?: { search?: string; department?: string }) {
    const { data } = await api.get<{ total: number; items: Employee[] }>('/employees', { params });
    return data;
  },
  async get(id: string) {
    const { data } = await api.get<Employee>(`/employees/${id}`);
    return data;
  },
  async create(payload: Partial<Employee>) {
    const { data } = await api.post<Employee>('/employees', payload);
    return data;
  },
  async update(id: string, payload: Partial<Employee>) {
    const { data } = await api.patch<Employee>(`/employees/${id}`, payload);
    return data;
  },
  async remove(id: string) {
    const { data } = await api.delete<{ message: string }>(`/employees/${id}`);
    return data;
  },
};

export const skillsApi = {
  async list(params?: { search?: string; type?: string; employeeId?: string }) {
    const { data } = await api.get<{ total: number; items: Skill[] }>('/skills', { params });
    let items = data.items;
    if (params?.employeeId) {
      items = items.filter((skill) => (skill.assignments || []).some((assignment) => assignment.employeeId === params.employeeId));
    }
    return { ...data, items };
  },
  async get(id: string) {
    const { data } = await api.get<Skill>(`/skills/${id}`);
    return data;
  },
  async create(payload: Partial<Skill>) {
    const { data } = await api.post<Skill>('/skills', payload);
    return data;
  },
  async update(id: string, payload: Partial<Skill>) {
    const { data } = await api.patch<Skill>(`/skills/${id}`, payload);
    return data;
  },
  async remove(id: string) {
    const { data } = await api.delete<{ message: string }>(`/skills/${id}`);
    return data;
  },
  async assign(skillId: string, payload: { employeeId: string; level: number; notes?: string; yearsOfExperience?: number; certificateName?: string; certificateUrl?: string; evidenceNote?: string; validated?: boolean; validatedBy?: string }) {
    const { data } = await api.post<Skill>(`/skills/${skillId}/assign`, payload);
    return data;
  },
  async unassign(skillId: string, employeeId: string) {
    const { data } = await api.delete<Skill>(`/skills/${skillId}/assign/${employeeId}`);
    return data;
  },
};

export const activitiesApi = {
  async list(params?: { search?: string; context?: string; status?: string; targetDepartment?: string; employeeId?: string; onlyMine?: boolean }) {
    const { data } = await api.get<{ total: number; items: Activity[] }>('/activities', { params });
    return data;
  },
  async getMine(employeeId: string) {
    const { data } = await api.get<{ total: number; items: Activity[] }>(`/activities/my/${employeeId}`);
    return data;
  },
  async get(id: string) {
    const { data } = await api.get<Activity>(`/activities/${id}`);
    return data;
  },
  async getCandidates(id: string) {
    const { data } = await api.get<{ activityId: string; activityTitle: string; items: Recommendation[] }>(`/activities/${id}/candidates`);
    return data;
  },
  async create(payload: Partial<Activity>) {
    const { data } = await api.post<Activity>('/activities', payload);
    return data;
  },
  async update(id: string, payload: Partial<Activity>) {
    const { data } = await api.patch<Activity>(`/activities/${id}`, payload);
    return data;
  },
  async remove(id: string) {
    const { data } = await api.delete<{ message: string }>(`/activities/${id}`);
    return data;
  },
  async enroll(activityId: string, payload: { employeeId: string; notes?: string }) {
    const { data } = await api.post<Activity>(`/activities/${activityId}/enroll`, payload);
    return data;
  },
  async review(activityId: string, employeeId: string, payload: { decision: 'Approved' | 'Rejected'; note?: string; reviewedBy?: string }) {
    const { data } = await api.patch<Activity>(`/activities/${activityId}/review/${employeeId}`, payload);
    return data;
  },
  async submitProof(activityId: string, employeeId: string, proofData: { title: string; type: string; url: string; note: string }) {
    const { data } = await api.post(`/activities/${activityId}/proofs/${employeeId}`, proofData);
    return data;
  },
  async reviewProof(activityId: string, employeeId: string, proofIndex: number, reviewData: { decision: 'approved' | 'rejected'; reviewNote: string; reviewedBy: string; progressWeight?: number }) {
    const { data } = await api.patch(`/activities/${activityId}/proofs/${employeeId}/${proofIndex}`, reviewData);
    return data;
  },
  async updateProgress(activityId: string, employeeId: string, payload: { progress?: number; notes?: string; proofs?: Array<{ title?: string; type?: string; url?: string; note?: string }> }) {
    const { data } = await api.patch<Activity>(`/activities/${activityId}/progress/${employeeId}`, payload);
    return data;
  },
  async unenroll(activityId: string, employeeId: string) {
    const { data } = await api.delete<Activity>(`/activities/${activityId}/enroll/${employeeId}`);
    return data;
  },
};

export const recommendationsApi = {
  async list(params?: { search?: string; status?: string; employeeId?: string; activityId?: string; skill?: string; matchLevel?: string }) {
    const { data } = await api.get<{ total: number; items: Recommendation[] }>('/recommendations', { params });
    return data;
  },
  async refresh() {
    const { data } = await api.post<{ total: number; items: Recommendation[] }>('/recommendations/refresh');
    return data;
  },
  async updateStatus(id: string, status: Recommendation['status']) {
    const { data } = await api.patch<Recommendation>(`/recommendations/${id}/status`, { status });
    return data;
  },
};

export const analyticsApi = {
  async dashboard() {
    const { data } = await api.get<AnalyticsResponse>('/analytics/dashboard');
    return data;
  },
  async employee(employeeId: string) {
    const { data } = await api.get<EmployeeEvolutionResponse>(`/analytics/employee/${employeeId}`);
    return data;
  },
};

export const notificationsApi = {
  async list(params?: { userId?: string; filter?: 'all' | 'unread'; category?: string }) {
    const { data } = await api.get<{ total: number; unread: number; items: NotificationItem[] }>('/notifications', { params });
    return data;
  },
  async seed(userId: string) {
    const { data } = await api.post<{ message: string }>(`/notifications/seed/${userId}`);
    return data;
  },
  async markRead(id: string) {
    const { data } = await api.patch<NotificationItem>(`/notifications/${id}/read`);
    return data;
  },
  async markAllRead(userId: string) {
    const { data } = await api.patch<{ message: string }>(`/notifications/read/all/${userId}`);
    return data;
  },
  async remove(id: string) {
    const { data } = await api.delete<{ message: string }>(`/notifications/${id}`);
    return data;
  },
};

export const settingsApi = {
  async get(userId: string) {
    const { data } = await api.get<UserSettings>(`/settings/${userId}`);
    return data;
  },
  async update(userId: string, payload: Partial<UserSettings>) {
    const { data } = await api.patch<UserSettings>(`/settings/${userId}`, payload);
    return data;
  },
};
