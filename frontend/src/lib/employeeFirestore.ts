/**
 * Mongo-backed employee data API client.
 *
 * NOTE: Kept file/module name for compatibility with existing imports.
 */

function normalizeApiBaseUrl(raw: string | undefined): string {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return '';
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  return withScheme.replace(/\/+$/, '');
}

const API_BASE_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);

export const COLLECTIONS = {
  PROFILES: 'employee_profiles',
  PHOTOS: 'employee_photos',
  INSIGHTS: 'employee_insights',
} as const;

export type RiskLevel = 'Low' | 'Medium' | 'High';

/** Salary history point */
export interface SalaryHistoryPoint {
  year: string;
  salary: number;
}

/** employee_profiles – one doc per employee (id = numeric string "1", "2", ... or employeeId) */
export interface EmployeeProfileDoc {
  id: string;
  name: string;
  role: string;
  department: string;
  manager: string;
  dateOfJoining: string;
  employmentType: string;
  location: string;
  employeeId: string;
  baseSalary: string;
  bonus: string;
  stockOptions: string;
  totalCompensation: string;
  lastRevision: string;
  nextReview: string;
  salaryHistory?: SalaryHistoryPoint[];
  documents?: { name: string }[];
  avatarIndex?: number;
}

/** employee_photos – photo URL per employee */
export interface EmployeePhotoDoc {
  employeeId: string;
  url: string;
  updatedAt?: string;
}

/** employee_insights – behavior, personality, sentiment, meetings, risks */
export interface EngagementMetric {
  metric: string;
  score: number;
  fill: string;
}

export interface MeetingItem {
  date: string;
  topic: string;
  sentiment: string;
  color: string;
}

export interface RiskIndicator {
  label: string;
  level: RiskLevel;
  color: string;
}

export interface EmployeeInsightsDoc {
  employeeId: string;
  sentiment: number;
  sentimentTrend?: { month: string; score: number }[];
  positiveNegative?: string;
  behavioral?: {
    communicationStyle?: string;
    personalityTraits?: string;
    motivationDrivers?: string;
    feedbackPreference?: string;
    collaborationStyle?: string;
  };
  engagementMetrics?: EngagementMetric[];
  communication?: {
    topTopics?: string[];
    concernsRaised?: string[];
    careerInterests?: string[];
    recentTopics?: string[];
  };
  meetings?: MeetingItem[];
  riskIndicators?: RiskIndicator[];
  risk?: RiskLevel;
}

/** Normalized employee for UI (profile + insights.risk + insights.sentiment + photo) */
export interface EmployeeFromFirestore {
  id: number;
  name: string;
  role: string;
  department: string;
  sentiment: number;
  risk: RiskLevel;
  manager: string;
  dateOfJoining: string;
  employmentType: string;
  location: string;
  employeeId: string;
  baseSalary: string;
  bonus: string;
  stockOptions: string;
  totalCompensation: string;
  lastRevision: string;
  nextReview: string;
  avatarIndex: number;
  photoUrl?: string | null;
}

/** For list view: Employee shape + optional photoUrl */
export type EmployeeListItem = EmployeeFromFirestore;

function docIdFromRoute(id: string | number): string {
  return String(id);
}

async function apiGet<T>(path: string): Promise<T | null> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }

  return (await response.json()) as T;
}

/** Fetch a single employee profile by id (numeric or employeeId) */
export async function getEmployeeProfile(
  id: string | number
): Promise<EmployeeProfileDoc | null> {
  const docId = docIdFromRoute(id);
  const data = await apiGet<{ status: string; profile?: EmployeeProfileDoc }>(
    `/api/employees/${encodeURIComponent(docId)}/profile`
  );
  if (!data?.profile) return null;
  return data.profile;
}

/** Fetch all employee profiles (for list view) */
export async function getEmployeeProfiles(): Promise<EmployeeProfileDoc[]> {
  const data = await apiGet<{
    status: string;
    employees?: EmployeeFromFirestore[];
  }>(`/api/employees?limit=200`);

  if (!data?.employees) return [];

  return data.employees.map((employee) => ({
    id: String(employee.id),
    name: employee.name,
    role: employee.role,
    department: employee.department,
    manager: employee.manager,
    dateOfJoining: employee.dateOfJoining,
    employmentType: employee.employmentType,
    location: employee.location,
    employeeId: employee.employeeId,
    baseSalary: employee.baseSalary,
    bonus: employee.bonus,
    stockOptions: employee.stockOptions,
    totalCompensation: employee.totalCompensation,
    lastRevision: employee.lastRevision,
    nextReview: employee.nextReview,
    avatarIndex: employee.avatarIndex,
    salaryHistory: [],
  }));
}

/** Fetch employee photo by id */
export async function getEmployeePhoto(
  id: string | number
): Promise<EmployeePhotoDoc | null> {
  // Photo storage is optional in Mongo path; return null when unavailable.
  return null;
}

/** Fetch employee insights (behavior, sentiment, meetings, risks) by id */
export async function getEmployeeInsights(
  id: string | number
): Promise<EmployeeInsightsDoc | null> {
  const docId = docIdFromRoute(id);
  const data = await apiGet<{ status: string; insights?: EmployeeInsightsDoc }>(
    `/api/employees/${encodeURIComponent(docId)}/insights`
  );
  if (!data?.insights) return null;
  return data.insights;
}

/** Build full employee for list: profile + photo + insights (sentiment, risk) */
export async function getEmployeeForList(
  profile: EmployeeProfileDoc
): Promise<EmployeeFromFirestore> {
  const docId = profile.id;
  const [photo, insights] = await Promise.all([
    getEmployeePhoto(docId),
    getEmployeeInsights(docId),
  ]);

  return {
    id: parseInt(docId, 10) || 0,
    name: profile.name,
    role: profile.role,
    department: profile.department,
    sentiment: insights?.sentiment ?? 0,
    risk: insights?.risk ?? 'Low',
    manager: profile.manager,
    dateOfJoining: profile.dateOfJoining,
    employmentType: profile.employmentType,
    location: profile.location,
    employeeId: profile.employeeId,
    baseSalary: profile.baseSalary,
    bonus: profile.bonus,
    stockOptions: profile.stockOptions,
    totalCompensation: profile.totalCompensation,
    lastRevision: profile.lastRevision,
    nextReview: profile.nextReview,
    avatarIndex: profile.avatarIndex ?? 0,
    photoUrl: photo?.url ?? null,
  };
}

/** List all employees from Firestore (profiles + photo + insights merged) */
export async function listEmployeesFromFirestore(): Promise<
  EmployeeFromFirestore[]
> {
  const data = await apiGet<{
    status: string;
    employees?: EmployeeFromFirestore[];
  }>(`/api/employees?limit=200`);

  const result = data?.employees ?? [];
  result.sort((a, b) => a.id - b.id);
  return result;
}
