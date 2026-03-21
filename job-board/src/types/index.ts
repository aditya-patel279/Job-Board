export type Role = 'employer' | 'applicant';

export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship';
export type LocationType = 'remote' | 'hybrid' | 'on-site';
export type ApplicationStatus = 'pending' | 'reviewed' | 'interview' | 'offered' | 'rejected';

export interface User {
  id: string;
  email: string;
  password: string; // hashed in real app; plain for mock
  name: string;
  role: Role;
  createdAt: string;
}

export interface Job {
  id: string;
  employerId: string;
  title: string;
  company: string;
  description: string;
  requirements: string;
  salary: { min: number; max: number; currency: string };
  location: string;
  locationType: LocationType;
  jobType: JobType;
  tags: string[];
  status: 'open' | 'closed';
  createdAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  applicantId: string;
  coverLetter: string;
  resumeFileName: string;
  resumeContent: string; // base64 in mock
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}
