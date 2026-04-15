export type UserRole = 'HR' | 'Manager' | 'Employee';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  jobTitle?: string;
  isActive?: boolean;
}

export interface EducationItem {
  degree?: string;
  institution?: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
  grade?: string;
  description?: string;
}

export interface CertificationItem {
  name?: string;
  issuer?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface Employee {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  location?: string;
  employmentType?: string;
  status?: string;
  managerName?: string;
  yearsOfExperience?: number;
  skillsCount?: number;
  activitiesCount?: number;
  bio?: string;
  joinedAt?: string;
  education?: EducationItem[];
  certifications?: CertificationItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SkillAssignment {
  employeeId: string;
  employeeName: string;
  level: number;
  notes?: string;
  yearsOfExperience?: number;
  certificateName?: string;
  certificateUrl?: string;
  evidenceNote?: string;
  validated?: boolean;
  validatedBy?: string;
}

export interface Skill {
  _id: string;
  name: string;
  type: 'Knowledge' | 'Know-How' | 'Soft Skill';
  category?: string;
  description?: string;
  trending?: boolean;
  assignments?: SkillAssignment[];
  employeeCount?: number;
  averageLevel?: number;
}

export interface ActivitySkillRequirement {
  name: string;
  level: number;
}

export interface ActivityProof {
  title?: string;
  type?: string;
  url?: string;
  note?: string;
  createdAt?: string;
  status?: 'pending' | 'approved' | 'rejected';
  progressWeight?: number;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface ActivityEnrollment {
  employeeId: string;
  employeeName: string;
  status: string;
  notes?: string;
  progress?: number;
  managerDecision?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  startedAt?: string;
  completedAt?: string;
  proofs?: ActivityProof[];
  enrolledAt?: string;
}

export interface Activity {
  _id: string;
  title: string;
  description?: string;
  context: 'Upskilling' | 'Expertise' | 'Development';
  targetDepartment?: string;
  requiresManagerApproval?: boolean;
  requiredSkills?: ActivitySkillRequirement[];
  seats: number;
  enrolled?: number;
  status: 'Draft' | 'Validated' | 'In Progress' | 'Completed';
  startDate?: string;
  endDate?: string;
  enrollments?: ActivityEnrollment[];
}

export interface Recommendation {
  _id: string;
  employeeId: string;
  employeeName: string;
  activityId: string;
  activityTitle: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  rationale: string;
  status: 'Open' | 'Accepted' | 'Dismissed';
  createdAt?: string;
}

export interface NotificationItem {
  _id: string;
  userId: string;
  type: 'success' | 'warning' | 'info' | 'alert';
  title: string;
  message: string;
  category: 'Recommendation' | 'Activity' | 'Skill' | 'System';
  link?: string;
  read: boolean;
  createdAt?: string;
}

export interface UserSettings {
  _id?: string;
  userId: string;
  language: 'en' | 'fr';
  theme: 'light' | 'dark';
  emailNotifications: boolean;
  pushNotifications: boolean;
  activityNotifications: boolean;
  recommendationNotifications: boolean;
}

export interface EmployeeEvolutionResponse {
  employeeId: string;
  employeeName: string;
  metrics: {
    certifications: number;
    activities: number;
    completedActivities: number;
    validatedSkills: number;
  };
  skills: Array<{ skill: string; level: number; validated: boolean; yearsOfExperience: number }>;
  activities: Array<{ activityId: string; title: string; status: string; progress: number; proofs: ActivityProof[] }>;
  evolution: Array<{ step: string; score: number; status: string }>;
}

export interface AnalyticsResponse {
  metrics: {
    skillsAdded: number;
    avgSkillLevel: number;
    activeEmployees: number;
    completionRate: number;
  };
  employeesByDepartment: Array<{ name: string; value: number }>;
  topSkills: Array<{ name: string; value: number }>;
  activityStatuses: Array<{ name: string; value: number }>;
  recommendationStatuses: Array<{ name: string; value: number }>;
  summary: {
    totalRecommendations: number;
    successfulPlacements: number;
    averageTimeToMatch: number;
  };
}
